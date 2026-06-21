import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── POST: Add Section to Course ─────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
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

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Section title is required" }, { status: 400 });
    }

    // Get max order
    const lastSection = await prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
    });

    const nextOrder = lastSection ? lastSection.order + 1 : 1;

    const section = await prisma.section.create({
      data: {
        title,
        order: nextOrder,
        courseId,
      },
    });

    return NextResponse.json({
      success: true,
      data: section,
      message: "Section created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("[SECTIONS_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to create section" }, { status: 500 });
  }
}

// ─── PUT: Reorder Sections ───────────────────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
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

    const body = await request.json();
    const { sections } = body; // Array of { id: string, order: number }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ success: false, error: "Invalid sections array" }, { status: 400 });
    }

    // Perform updates in a batch transaction
    const updatePromises = sections.map((sec) =>
      prisma.section.update({
        where: { id: sec.id, courseId },
        data: { order: sec.order },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({
      success: true,
      message: "Sections reordered successfully",
    });
  } catch (error) {
    console.error("[SECTIONS_REORDER_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to reorder sections" }, { status: 500 });
  }
}
