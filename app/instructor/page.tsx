import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { BookOpen, Users, DollarSign, Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InstructorOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/instructor");
  }

  const instructorId = session.user.id;

  // 1. Fetch counters
  const totalCourses = await prisma.course.count({
    where: { instructorId },
  });

  const totalStudents = await prisma.enrollment.count({
    where: {
      course: { instructorId },
    },
  });

  const sumRevenue = await prisma.transaction.aggregate({
    where: {
      status: "COMPLETED",
      enrollment: {
        course: { instructorId },
      },
    },
    _sum: {
      instructorPayout: true,
    },
  });
  const totalRevenue = Number(sumRevenue._sum.instructorPayout || 0);

  const avgRatingAggregate = await prisma.course.aggregate({
    where: { instructorId, status: "PUBLISHED" },
    _avg: {
      averageRating: true,
    },
  });
  const averageRating = Number(avgRatingAggregate._avg.averageRating || 0);

  // 2. Fetch recent enrollments
  const recentEnrollments = await prisma.enrollment.findMany({
    where: {
      course: { instructorId },
    },
    take: 5,
    orderBy: { enrolledAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });

  const METRICS = [
    { label: "Total Courses", value: totalCourses, icon: <BookOpen className="h-5 w-5 text-blue-500" /> },
    { label: "Active Students", value: totalStudents.toLocaleString(), icon: <Users className="h-5 w-5 text-indigo-500" /> },
    { label: "Total Earnings", value: formatPrice(totalRevenue), icon: <DollarSign className="h-5 w-5 text-emerald-500" /> },
    { label: "Average Rating", value: `${averageRating.toFixed(1)} ★`, icon: <Star className="h-5 w-5 text-amber-500 fill-amber-500/10" /> },
  ];

  return (
    <div className="space-y-8 bg-white min-h-screen text-zinc-800 antialiased">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
            Instructor Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Track metrics and manage course publishing and payout history
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Create New Course
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 hover:border-zinc-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {m.label}
              </span>
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                {m.icon}
              </div>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-none">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Split layout: Recent Enrollments & Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Enrollments Table */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
            <h3 className="text-sm font-bold text-zinc-800">
              Recent Student Enrollments
            </h3>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Last 5 Signups
            </span>
          </div>

          {recentEnrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5">Student</th>
                    <th className="py-2.5">Course</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 font-semibold text-zinc-800">
                        {enr.user.name || "Student"}
                        <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">
                          {enr.user.email}
                        </span>
                      </td>
                      <td className="py-3 font-medium truncate max-w-[150px]">
                        <Link href={`/courses/${enr.course.id}`} className="text-zinc-700 hover:text-blue-600 transition font-semibold">
                          {enr.course.title}
                        </Link>
                      </td>
                      <td className="py-3 font-bold text-zinc-800">
                        {formatPrice(Number(enr.amountPaid))}
                      </td>
                      <td className="py-3 text-zinc-400 font-medium">
                        {formatDate(enr.enrolledAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-xs font-medium">
              No students enrolled in your courses yet. Keep designing your curriculum!
            </div>
          )}
        </div>

        {/* Quick Links Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6">
          <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-4 mb-4">
            Instructor Quick Links
          </h3>
          <div className="space-y-2">
            {[
              { label: "Manage Course Listing", href: "/instructor/courses", description: "Edit curriculum drafts and preview lessons" },
              { label: "Submit Course for Moderation", href: "/instructor/courses", description: "Request publish validation from platform admins" },
              { label: "Review Payout Invoices", href: "/instructor/revenue", description: "Verify your bank transfer and Stripe fees" },
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="group block p-3 rounded-xl border border-zinc-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 group-hover:text-blue-600 transition-colors">
                    {link.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}