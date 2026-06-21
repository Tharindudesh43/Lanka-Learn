import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/stripe";
import { sendEnrollmentEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body = "";
  try {
    body = await request.text();
  } catch (err) {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature") || "";

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err: any) {
    console.error(`[STRIPE_WEBHOOK_VERIFY_FAILED]`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata;

    if (!metadata || !metadata.courseId || !metadata.userId) {
      console.error("[STRIPE_WEBHOOK] Missing metadata in session", session.id);
      return NextResponse.json({ error: "Missing metadata in session" }, { status: 400 });
    }

    const { courseId, userId } = metadata;
    const stripeSessionId = session.id;
    const stripePaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;

    try {
      // Check if already enrolled to avoid duplicates
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (existing) {
        console.log(`[STRIPE_WEBHOOK] User ${userId} already enrolled in ${courseId}`);
        console.log(`[STRIPE_WEBHOOK] Enrollment created for user ${userId} in course ${courseId}`);

      // ── Send enrollment confirmation email (non-blocking) ──
      const enrolledUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      const enrolledCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      });
      if (enrolledUser?.email && enrolledCourse) {
        sendEnrollmentEmail({
          name: enrolledUser.name || enrolledUser.email,
          email: enrolledUser.email,
          courseTitle: enrolledCourse.title,
          courseId,
          amountPaid,
        });
      }

      return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Create Enrollment
        const enrollment = await tx.enrollment.create({
          data: {
            userId,
            courseId,
            stripeSessionId,
            stripePaymentIntentId,
            amountPaid,
          },
        });

        // 2. Increment Course totalEnrollments
        await tx.course.update({
          where: { id: courseId },
          data: {
            totalEnrollments: { increment: 1 },
          },
        });

        // 3. Create Transaction
        const platformFee = amountPaid * 0.15; // 15% platform fee
        const instructorPayout = amountPaid - platformFee;

        await tx.transaction.create({
          data: {
            enrollmentId: enrollment.id,
            stripePaymentIntentId,
            amount: amountPaid,
            platformFee,
            instructorPayout,
            status: "COMPLETED",
          },
        });

        // 4. Initialize Progress for all lessons in this course
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
              userId,
              lessonId: lesson.id,
              enrollmentId: enrollment.id,
              completed: false,
              watchedSeconds: 0,
            })),
          });
        }
      });

      console.log(`[STRIPE_WEBHOOK] Successfully processed enrollment for User ${userId} on Course ${courseId}`);
    } catch (err) {
      console.error("[STRIPE_WEBHOOK_DB_WRITE_FAILED]", err);
      return NextResponse.json({ error: "Database transaction failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
