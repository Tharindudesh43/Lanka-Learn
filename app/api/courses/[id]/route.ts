import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// ─── GET: Course Detail ──────────────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
            bio: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                order: true,
                isFreePreview: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Check if the user is enrolled or if the user is the instructor of this course or admin
    let isEnrolled = false;
    let progressData: any[] = [];

    if (session) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id,
          },
        },
        include: {
          progress: true,
        },
      });

      if (enrollment) {
        isEnrolled = true;
        progressData = enrollment.progress;
      } else if (session.user.id === course.instructorId || session.user.role === "ADMIN") {
        isEnrolled = true; // Instructors and Admins get full access
      }
    }

    // If enrolled, we can fetch all lessons with full details (videoUrl, pdfUrl, content)
    let sectionsWithAccess = course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => {
        const prog = progressData.find((p) => p.lessonId === lesson.id);
        return {
          ...lesson,
          isCompleted: prog ? prog.completed : false,
          watchedSeconds: prog ? prog.watchedSeconds : 0,
        };
      }),
    }));

    // If the user wants full lesson detail but is enrolled, they will fetch via learn routes
    const formattedCourse = {
      ...course,
      price: Number(course.price),
      averageRating: Number(course.averageRating),
      isEnrolled,
      sections: sectionsWithAccess,
    };

    return NextResponse.json({
      success: true,
      data: formattedCourse,
    });
  } catch (error) {
    console.error("[COURSE_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch course details" }, { status: 500 });
  }
}

// ─── PUT: Update Course (Instructor Owner or Admin Only) ─────────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Authorize: course owner or admin
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      shortDescription,
      thumbnail,
      previewVideoUrl,
      price,
      categoryId,
      level,
      language,
      status, // Note: admins can approve directly, instructors submit for review
    } = body;

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
      // update slug
      let slug = slugify(title);
      const existing = await prisma.course.findUnique({
        where: { slug },
      });
      if (existing && existing.id !== course.id) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }
      updateData.slug = slug;
    }

    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (previewVideoUrl !== undefined) updateData.previewVideoUrl = previewVideoUrl;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (level !== undefined) updateData.level = level;
    if (language !== undefined) updateData.language = language;

    // Status state machine
    if (status !== undefined) {
      if (session.user.role === "ADMIN") {
        updateData.status = status;
      } else {
        // Instructor submitting draft for review
        if (status === "PENDING_REVIEW" && course.status === "DRAFT") {
          updateData.status = "PENDING_REVIEW";
        } else if (status === "DRAFT") {
          updateData.status = "DRAFT";
        } else {
          return NextResponse.json({ success: false, error: "Cannot change status directly to " + status }, { status: 400 });
        }
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCourse,
        price: Number(updatedCourse.price),
      },
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("[COURSE_PUT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update course" }, { status: 500 });
  }
}

// ─── DELETE: Delete Course (Instructor Owner or Admin Only) ──────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: { take: 1 },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Authorize: course owner or admin
    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Check enrollments
    if (course.enrollments.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete a course that already has enrolled students",
      }, { status: 400 });
    }

    // Delete course (cascades Section and Lesson because of schema relation setup)
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("[COURSE_DELETE_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to delete course" }, { status: 500 });
  }
}
