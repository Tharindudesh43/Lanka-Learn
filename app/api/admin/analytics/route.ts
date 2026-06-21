import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    // Platform Counts
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });
    const totalInstructors = await prisma.user.count({ where: { role: "INSTRUCTOR" } });
    const totalCourses = await prisma.course.count();
    const totalPublishedCourses = await prisma.course.count({ where: { status: "PUBLISHED" } });
    const totalEnrollments = await prisma.enrollment.count();

    const sumRevenue = await prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    });
    const totalRevenue = Number(sumRevenue._sum.amount || 0);

    // Fetch last 12 months data for trends
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Fetch users created in the last 12 months
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true },
    });

    // Fetch transactions in the last 12 months
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true, amount: true },
    });

    // Helper to generate chronological list of last 12 months
    const monthsList: { label: string; year: number; month: number }[] = [];
    const tempDate = new Date(twelveMonthsAgo);
    for (let i = 0; i < 12; i++) {
      monthsList.push({
        label: tempDate.toLocaleString("en-US", { month: "short" }),
        year: tempDate.getFullYear(),
        month: tempDate.getMonth(),
      });
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    // Map user signups to months
    const signupsByMonth = monthsList.map((m) => {
      const count = recentUsers.filter((u) => {
        const d = new Date(u.createdAt);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      }).length;
      return { month: `${m.label} ${m.year}`, count };
    });

    // Map transaction revenue to months
    const revenueByMonth = monthsList.map((m) => {
      const revenue = recentTransactions
        .filter((t) => {
          const d = new Date(t.createdAt);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { month: `${m.label} ${m.year}`, revenue: Math.round(revenue * 100) / 100 };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        totalPublishedCourses,
        totalEnrollments,
        totalRevenue,
        signupsByMonth,
        revenueByMonth,
      },
    });
  } catch (error) {
    console.error("[ADMIN_ANALYTICS_GET_ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch platform analytics" }, { status: 500 });
  }
}
