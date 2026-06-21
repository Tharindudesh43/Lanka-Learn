import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// ─── GET: List Courses (Marketplace) ─────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const level = searchParams.get("level") || "";
    const minPriceStr = searchParams.get("minPrice");
    const maxPriceStr = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "newest";
    const instructorId = searchParams.get("instructorId") || "";
    const status = searchParams.get("status") || "PUBLISHED";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));

    // Base conditions
    const where: any = {};

    // Gating check if querying drafts or special statuses
    if (status !== "PUBLISHED" || instructorId) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      if (instructorId) {
        // Instructors can only view their own courses if not ADMIN
        if (session.user.id !== instructorId && session.user.role !== "ADMIN") {
          return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        where.instructorId = instructorId;
      }

      if (status) {
        where.status = status;
      }
    } else {
      // Public marketplace only shows published courses
      where.status = "PUBLISHED";
    }

    // Apply filters
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { shortDescription: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (level) {
      where.level = level;
    }

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : null;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : null;

    if (minPrice !== null || maxPrice !== null) {
      where.price = {};
      if (minPrice !== null) where.price.gte = minPrice;
      if (maxPrice !== null) where.price.lte = maxPrice;
    }

    // Sort order mapping
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "popular") {
      orderBy = { totalEnrollments: "desc" };
    } else if (sortBy === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sortBy === "rating") {
      orderBy = { averageRating: "desc" };
    }

    // Query databases
    const totalCount = await prisma.course.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);

    const courses = await prisma.course.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Format Decimal fields to float for client serialization
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
    console.error("[COURSES_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}

// ─── POST: Create Course (Instructor Only) ───────────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Instructor access required" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, shortDescription, price, categoryId, level, language } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    // Check slug uniqueness and append random string if conflicts exist
    let slug = slugify(title);
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || "",
        shortDescription: shortDescription || "",
        price: price ? parseFloat(price) : 0,
        categoryId: categoryId || null,
        level: level || "BEGINNER",
        language: language || "English",
        instructorId: session.user.id,
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        price: Number(course.price),
      },
      message: "Course draft created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("[COURSES_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to create course" }, { status: 500 });
  }
}
