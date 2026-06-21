import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId, courseId },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const updated = await prisma.section.update({
      where: { id: sectionId },
      data: { title },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Section updated successfully",
    });
  } catch (error) {
    console.error("[SECTION_PUT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(
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

    if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId, courseId },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });

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

    await prisma.course.update({
      where: { id: courseId },
      data: {
        totalDuration: aggregate._sum.duration || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Section and its lessons deleted successfully",
    });
  } catch (error) {
    console.error("[SECTION_DELETE_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to delete section" }, { status: 500 });
  }
}