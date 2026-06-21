import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

// Function to update the course total duration
async function updateCourseDuration(courseId: string) {
  const aggregate = await prisma.lesson.aggregate({
    where: {
      section: {
        courseId,
      },
    },
    _sum: {
      duration: true,
    },
  });

  const totalDuration = aggregate._sum.duration || 0;

  await prisma.course.update({
    where: { id: courseId },
    data: { totalDuration },
  });
}

// ─── PUT: Update Single Lesson ───────────────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
) {
  try {
    const { id: courseId, sectionId, lessonId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Owner or admin check
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId, courseId },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: "Section not found in this course" }, { status: 404 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId, sectionId },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found in this section" }, { status: 404 });
    }

    const body = await request.json();
    const { title, type, content, videoUrl, pdfUrl, duration, isFreePreview } = body;

    const parsedData: any = {};
    if (title !== undefined) parsedData.title = title;
    if (type !== undefined) parsedData.type = type;
    if (content !== undefined) parsedData.content = content;
    if (videoUrl !== undefined) parsedData.videoUrl = videoUrl;
    if (pdfUrl !== undefined) parsedData.pdfUrl = pdfUrl;
    if (duration !== undefined) parsedData.duration = parseInt(duration);
    if (isFreePreview !== undefined) parsedData.isFreePreview = !!isFreePreview;

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: parsedData,
    });

    if (duration !== undefined) {
      await updateCourseDuration(courseId);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Lesson updated successfully",
    });
  } catch (error) {
    console.error("[LESSON_PUT_SINGLE_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update lesson" }, { status: 500 });
  }
}

// ─── DELETE: Delete Single Lesson ────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
) {
  try {
    const { id: courseId, sectionId, lessonId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Owner or admin check
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId, courseId },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: "Section not found in this course" }, { status: 404 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId, sectionId },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found in this section" }, { status: 404 });
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // Update course duration
    await updateCourseDuration(courseId);

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("[LESSON_DELETE_SINGLE_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to delete lesson" }, { status: 500 });
  }
}
