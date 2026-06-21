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

// ─── PUT: Update a category (Admin) ──────────────────────────────────────────
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const slug = slugify(name);

    // Check for name/slug conflicts with OTHER categories
    const conflict = await prisma.category.findFirst({
      where: {
        AND: [{ id: { not: id } }, { OR: [{ name: name.trim() }, { slug }] }],
      },
    });
    if (conflict) {
      return NextResponse.json({ success: false, error: "Another category already uses this name" }, { status: 409 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("[ADMIN_CATEGORY_PUT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 });
  }
}

// ─── DELETE: Remove a category (Admin) ───────────────────────────────────────
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    if (existing._count.courses > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete — ${existing._count.courses} course(s) are using this category. Reassign them first.` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("[ADMIN_CATEGORY_DELETE_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
  }
}
