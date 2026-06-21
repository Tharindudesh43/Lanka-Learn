import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── GET: List all categories with course counts (Admin) ────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      createdAt: cat.createdAt,
      courseCount: cat._count.courses,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

// ─── POST: Create a new category (Admin) ─────────────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: name.trim() }, { slug }] },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "A category with this name already exists" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}
