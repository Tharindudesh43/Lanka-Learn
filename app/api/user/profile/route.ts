import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { name, headline, bio, image } = body;

    // Validate name
    if (name !== undefined && (!name || name.trim().length < 2)) {
      return NextResponse.json({ success: false, error: "Name must be at least 2 characters long" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (headline !== undefined) updateData.headline = headline.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (image !== undefined) updateData.image = image.trim();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        bio: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[PROFILE_PUT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
