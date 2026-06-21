import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));

    const where: any = {};
    if (status) where.status = status;

    const totalCount = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        enrollment: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      platformFee: Number(t.platformFee),
      instructorPayout: Number(t.instructorPayout),
      status: t.status,
      createdAt: t.createdAt,
      stripePaymentIntentId: t.stripePaymentIntentId,
      student: t.enrollment.user,
      course: t.enrollment.course,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: { page, pageSize, totalCount, totalPages, hasMore: page < totalPages },
    });
  } catch (error) {
    console.error("[ADMIN_TRANSACTIONS_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 });
  }
}
