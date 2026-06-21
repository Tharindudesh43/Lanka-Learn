import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                name: true,
                image: true,
              },
            },
            sections: {
              select: {
                id: true,
                lessons: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        progress: {
          select: {
            completed: true,
            updatedAt: true,
            lesson: {
              select: {
                id: true,
                title: true,
                sectionId: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const enrolledCourses = enrollments.map((enrollment) => {
      const { course, progress } = enrollment;

      // Calculate progress stats
      const totalLessons = course.sections.reduce((acc, sec) => acc + sec.lessons.length, 0);
      const completedLessons = progress.filter((p) => p.completed).length;
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Find last accessed lesson (most recently updated progress)
      let lastAccessedLesson = undefined;
      if (progress.length > 0) {
        const sortedProgress = [...progress].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        if (sortedProgress[0]?.lesson) {
          lastAccessedLesson = {
            id: sortedProgress[0].lesson.id,
            title: sortedProgress[0].lesson.title,
            sectionId: sortedProgress[0].lesson.sectionId,
          };
        }
      }

      return {
        id: course.id,
        enrollmentId: enrollment.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        instructor: {
          name: course.instructor.name,
          image: course.instructor.image,
        },
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        progress: progressPercent,
        totalLessons,
        completedLessons,
        lastAccessedLesson,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrolledCourses,
    });
  } catch (error) {
    console.error("[MY_COURSES_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch enrolled courses" }, { status: 500 });
  }
}
