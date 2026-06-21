import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── GET: Fetch Progress for a Course ────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
      include: {
        progress: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: enrollment.progress,
    });
  } catch (error) {
    console.error("[PROGRESS_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch progress" }, { status: 500 });
  }
}

// ─── POST: Update Progress for a Lesson ──────────────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, completed, watchedSeconds } = body;

    if (!lessonId) {
      return NextResponse.json({ success: false, error: "Lesson ID is required" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    const courseId = lesson.section.courseId;

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ success: false, error: "Not enrolled in this course" }, { status: 403 });
    }

    // Upsert progress
    const now = new Date();
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
      update: {
        completed: completed ?? false,
        watchedSeconds: watchedSeconds ? parseInt(watchedSeconds) : 0,
        completedAt: completed ? now : null,
      },
      create: {
        userId: session.user.id,
        lessonId,
        enrollmentId: enrollment.id,
        completed: completed ?? false,
        watchedSeconds: watchedSeconds ? parseInt(watchedSeconds) : 0,
        completedAt: completed ? now : null,
      },
    });

    // Check if course is fully completed
    const allCourseLessons = await prisma.lesson.findMany({
      where: {
        section: {
          courseId,
        },
      },
      select: {
        id: true,
      },
    });

    const userProgress = await prisma.progress.findMany({
      where: {
        userId: session.user.id,
        enrollmentId: enrollment.id,
        completed: true,
      },
      select: {
        lessonId: true,
      },
    });

    const completedLessonIds = userProgress.map((p) => p.lessonId);
    const isCourseCompleted = allCourseLessons.every((l) => completedLessonIds.includes(l.id));

    if (isCourseCompleted && !enrollment.completedAt) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: now },
      });
    } else if (!isCourseCompleted && enrollment.completedAt) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: progress,
      isCourseCompleted,
    });
  } catch (error) {
    console.error("[PROGRESS_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update progress" }, { status: 500 });
  }
}
