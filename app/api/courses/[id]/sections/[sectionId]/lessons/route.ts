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

// ─── POST: Create Lesson in Section ──────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id: courseId, sectionId } = await params;
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

    const body = await request.json();
    const { title, type, content, videoUrl, pdfUrl, duration, isFreePreview } = body;

    if (!title || !type) {
      return NextResponse.json({ success: false, error: "Title and type are required" }, { status: 400 });
    }

    // Get max order
    const lastLesson = await prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { order: "desc" },
    });

    const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        type,
        content: content || "",
        videoUrl: videoUrl || null,
        pdfUrl: pdfUrl || null,
        duration: duration ? parseInt(duration) : 0,
        isFreePreview: !!isFreePreview,
        order: nextOrder,
        sectionId,
      },
    });

    // Update course duration
    await updateCourseDuration(courseId);

    return NextResponse.json({
      success: true,
      data: lesson,
      message: "Lesson created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("[LESSONS_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to create lesson" }, { status: 500 });
  }
}

// ─── PUT: Reorder Lessons or Update a Single Lesson ──────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id: courseId, sectionId } = await params;
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

    const body = await request.json();
    const { lessons, lessonId, ...updateData } = body;

    // Case 1: Reordering lessons
    if (lessons && Array.isArray(lessons)) {
      const updatePromises = lessons.map((les) =>
        prisma.lesson.update({
          where: { id: les.id, sectionId },
          data: { order: les.order },
        })
      );

      await prisma.$transaction(updatePromises);

      return NextResponse.json({
        success: true,
        message: "Lessons reordered successfully",
      });
    }

    // Case 2: Update a single lesson passed directly in body (if lessonId is specified)
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId, sectionId },
      });

      if (!lesson) {
        return NextResponse.json({ success: false, error: "Lesson not found in this section" }, { status: 404 });
      }

      const parsedData: any = {};
      if (updateData.title !== undefined) parsedData.title = updateData.title;
      if (updateData.type !== undefined) parsedData.type = updateData.type;
      if (updateData.content !== undefined) parsedData.content = updateData.content;
      if (updateData.videoUrl !== undefined) parsedData.videoUrl = updateData.videoUrl;
      if (updateData.pdfUrl !== undefined) parsedData.pdfUrl = updateData.pdfUrl;
      if (updateData.duration !== undefined) parsedData.duration = parseInt(updateData.duration);
      if (updateData.isFreePreview !== undefined) parsedData.isFreePreview = !!updateData.isFreePreview;

      const updated = await prisma.lesson.update({
        where: { id: lessonId },
        data: parsedData,
      });

      if (updateData.duration !== undefined) {
        await updateCourseDuration(courseId);
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Lesson updated successfully",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    console.error("[LESSONS_PUT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update lessons" }, { status: 500 });
  }
}
