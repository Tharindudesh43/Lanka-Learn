import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";
import { sendEnrollmentEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    // Fetch course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json({ success: false, error: "This course is not available for enrollment" }, { status: 400 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ success: false, error: "You are already enrolled in this course" }, { status: 400 });
    }

    const price = Number(course.price);

    // Free enrollment bypasses Stripe
    if (price === 0) {
      const enrollment = await prisma.$transaction(async (tx) => {
        // Create enrollment
        const enroll = await tx.enrollment.create({
          data: {
            userId: session.user.id,
            courseId,
            amountPaid: 0,
          },
        });

        // Increment total enrollments count for the course
        await tx.course.update({
          where: { id: courseId },
          data: { totalEnrollments: { increment: 1 } },
        });

        // Initialize progress for all lessons in this course
        const lessons = await tx.lesson.findMany({
          where: {
            section: {
              courseId,
            },
          },
        });

        if (lessons.length > 0) {
          await tx.progress.createMany({
            data: lessons.map((lesson) => ({
              userId: session.user.id,
              lessonId: lesson.id,
              enrollmentId: enroll.id,
              completed: false,
              watchedSeconds: 0,
            })),
          });
        }

        return enroll;
      });

      // ── Send enrollment confirmation email (non-blocking) ──
      sendEnrollmentEmail({
        name: session.user.name || session.user.email || "Student",
        email: session.user.email!,
        courseTitle: course.title,
        courseId: course.id,
        amountPaid: 0,
      });

      return NextResponse.json({
        success: true,
        direct: true,
        data: enrollment,
        message: "Enrolled in course successfully",
      });
    }

    // Paid enrollment via Stripe
    const priceInCents = Math.round(price * 100);
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      courseId: course.id,
      courseTitle: course.title,
      priceInCents,
      userId: session.user.id,
      userEmail: session.user.email,
      successUrl: `${origin}/courses/${course.id}?success=true`,
      cancelUrl: `${origin}/courses/${course.id}?canceled=true`,
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("[ENROLL_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to process enrollment" }, { status: 500 });
  }
}
