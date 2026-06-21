import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { BookOpen, Users, DollarSign, Star, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface CourseAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function CourseAnalyticsPage({ params }: CourseAnalyticsPageProps) {
  const { id: courseId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/auth/login?callbackUrl=/instructor/courses/${courseId}/analytics`);
  }

  // 1. Fetch course details to verify owner/existence
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        select: {
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 2. Aggregate metrics
  const totalEnrollments = await prisma.enrollment.count({ where: { courseId } });
  
  const sumRevenue = await prisma.transaction.aggregate({
    where: {
      status: "COMPLETED",
      enrollment: { courseId },
    },
    _sum: {
      amount: true,
    },
  });
  const totalRevenue = Number(sumRevenue._sum.amount || 0);

  const totalReviews = await prisma.review.count({ where: { courseId } });

  // 3. Fetch detailed enrollment signups list
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { enrolledAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      progress: {
        select: {
          completed: true,
        },
      },
    },
  });

  const totalLessons = course.sections.reduce((acc, sec) => acc + sec.lessons.length, 0);

  const studentPerformance = enrollments.map((enr) => {
    const completedCount = enr.progress.filter((p) => p.completed).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    
    return {
      id: enr.id,
      name: enr.user.name || "Anonymous Student",
      email: enr.user.email,
      enrolledAt: enr.enrolledAt,
      amountPaid: Number(enr.amountPaid),
      progress: progressPercent,
    };
  });

  const METRICS = [
    { label: "Total Students", value: totalEnrollments.toLocaleString(), icon: <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> },
    { label: "Gross Revenue", value: formatPrice(totalRevenue), icon: <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
    { label: "Reviews Count", value: totalReviews, icon: <Star className="h-5 w-5 text-amber-500 fill-amber-500/10" /> },
    { label: "Average Rating", value: `${Number(course.averageRating).toFixed(1)} ★`, icon: <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" /> },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <Link
          href="/instructor/courses"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition font-semibold dark:hover:text-slate-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Courses
        </Link>
        <h1 className="mt-3 text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100 line-clamp-1">
          Analytics: {course.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 dark:text-slate-400">
          Monitor enrolled student study rates, gross sales revenue, and individual course progress levels.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {m.label}
              </span>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/45">
                {m.icon}
              </div>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white leading-none">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Student List */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
          Enrolled Student Performance
        </h3>

        {studentPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-550 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-50 text-slate-400 font-bold uppercase tracking-wider dark:border-slate-800/60">
                  <th className="py-2.5">Student</th>
                  <th className="py-2.5">Enrolled Date</th>
                  <th className="py-2.5">Price Paid</th>
                  <th className="py-2.5">Course Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {studentPerformance.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {student.name}
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        {student.email}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {formatDate(student.enrolledAt)}
                    </td>
                    <td className="py-3 font-bold text-slate-700 dark:text-slate-300">
                      {formatPrice(student.amountPaid)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 max-w-[120px]">
                        <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-850">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px] text-slate-700 min-w-[28px] text-right dark:text-slate-300">
                          {student.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No students enrolled in this course yet.
          </div>
        )}
      </div>

    </div>
  );
}
