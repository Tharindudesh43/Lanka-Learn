import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendCourseStatusEmail } from "@/lib/email";

// ─── GET: List All Courses for Moderation (Admin Only) ───────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const totalCount = await prisma.course.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);

    const courses = await prisma.course.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const formattedCourses = courses.map((course) => ({
      ...course,
      price: Number(course.price),
      averageRating: Number(course.averageRating),
    }));

    return NextResponse.json({
      success: true,
      data: formattedCourses,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("[ADMIN_COURSES_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}

// ─── PUT: Approve or Reject a Course (Admin Only) ────────────────────────────
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, status, rejectionReason } = body;

    if (!courseId || !status) {
      return NextResponse.json({ success: false, error: "courseId and status are required" }, { status: 400 });
    }

    if (status !== "PUBLISHED" && status !== "REJECTED") {
      return NextResponse.json({ success: false, error: "Invalid status update. Must be PUBLISHED or REJECTED" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const updateData: any = {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason || "No reason specified" : null,
    };

    // ── Include instructor relation so we have their name/email for the notification ──
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    // ── Send course status email to instructor (non-blocking, logs errors) ──
    console.log("[ADMIN_COURSE_PUT] Triggering email →", updated.instructor.email, "| status:", status);
    sendCourseStatusEmail({
      instructorName: updated.instructor.name || updated.instructor.email,
      instructorEmail: updated.instructor.email,
      courseTitle: updated.title,
      courseId: updated.id,
      status: status as "PUBLISHED" | "REJECTED",
      rejectionReason: updateData.rejectionReason || undefined,
    }).catch((err) => console.error("[ADMIN_COURSE_PUT] Email failed:", err));

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        price: Number(updated.price),
      },
      message: `Course ${status === "PUBLISHED" ? "approved and published" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("[ADMIN_COURSE_PUT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update course status" }, { status: 500 });
  }
}