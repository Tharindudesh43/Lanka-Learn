import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper function to update course average rating and total reviews
async function updateCourseRating(courseId: string) {
  const reviews = await prisma.review.aggregate({
    where: { courseId },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: {
      averageRating: reviews._avg.rating || 0,
      totalReviews: reviews._count.id || 0,
    },
  });
}

// ─── GET: List Reviews for a Course ──────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "5"));

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const totalCount = await prisma.review.count({
      where: { courseId },
    });
    const totalPages = Math.ceil(totalCount / pageSize);

    const reviews = await prisma.review.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("[REVIEWS_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// ─── POST: Submit a Review (Enrolled Students Only) ──────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, rating, comment } = body;

    if (!courseId || rating === undefined) {
      return NextResponse.json({ success: false, error: "Course ID and rating are required" }, { status: 400 });
    }

    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ success: false, error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }

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
      return NextResponse.json({ success: false, error: "You must be enrolled in this course to leave a review" }, { status: 403 });
    }

    // Upsert review (allows students to update their rating/comment)
    const review = await prisma.review.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
      update: {
        rating: numericRating,
        comment: comment || "",
      },
      create: {
        userId: session.user.id,
        courseId,
        rating: numericRating,
        comment: comment || "",
      },
    });

    // Recalculate average rating & total reviews count
    await updateCourseRating(courseId);

    return NextResponse.json({
      success: true,
      data: review,
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error("[REVIEWS_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}
