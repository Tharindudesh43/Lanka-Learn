import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { BookOpen, Edit2, BarChart2, Plus, AlertCircle, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InstructorCoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/instructor/courses");
  }

  const instructorId = session.user.id;

  const courses = await prisma.course.findMany({
    where: { instructorId },
    orderBy: { updatedAt: "desc" },
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

  const getStatusBadge = (status: string, reason?: string | null) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
            Draft
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 uppercase tracking-wide">
            Pending Review
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
            Published
          </span>
        );
      case "REJECTED":
        return (
          <span
            title={reason || "No details provided"}
            className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 uppercase cursor-help flex items-center gap-1 w-fit tracking-wide"
          >
            Rejected
            <HelpCircle className="h-3 w-3" />
          </span>
        );
      default:
        return (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white -m-6 sm:-m-8 p-6 sm:p-8">
      {/* Ambient blur accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative space-y-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              My Courses
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your courses, curriculum, and publish updates for students
            </p>
          </div>
          <Link
            href="/instructor/courses/new"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200/60 transition"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {courses.map((course) => {
              const lessonsCount = course.sections.reduce((sum, sec) => sum + sec.lessons.length, 0);
              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(59,130,246,0.06)] transition-all hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)] hover:border-blue-100 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                >
                  {/* Course Thumbnail */}
                  <div className="relative aspect-video w-full sm:w-36 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 shrink-0 border border-blue-100/50">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-blue-200">
                        <BookOpen className="h-8 w-8 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                  {/* Course Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(course.status, course.rejectionReason)}
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                        {course.level.toLowerCase()}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 truncate">
                      {course.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
                      <span>{course.sections.length} Section{course.sections.length !== 1 ? "s" : ""}</span>
                      <span className="text-slate-300">•</span>
                      <span>{lessonsCount} Lesson{lessonsCount !== 1 ? "s" : ""}</span>
                      <span className="text-slate-300">•</span>
                      <span>{course.totalEnrollments.toLocaleString()} students enrolled</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-blue-600 font-bold">{formatPrice(Number(course.price))}</span>
                    </div>

                    {course.status === "REJECTED" && course.rejectionReason && (
                      <p className="rounded-xl bg-red-50/80 border border-red-100 p-2.5 text-xs text-red-700 flex items-start gap-1.5 font-medium max-w-xl">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <span>Rejection reason: {course.rejectionReason}</span>
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0">
                    <Link
                      href={`/instructor/courses/${course.id}/edit`}
                      className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-white/80 backdrop-blur px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition shadow-sm"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.id}/analytics`}
                      className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                      Analytics
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-dashed border-blue-200 bg-white/60 backdrop-blur-xl text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <BookOpen className="h-7 w-7 text-blue-400 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-700">You haven't created any courses yet</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
              Become an instructor and monetize your expertise! Build interactive curriculums, upload videos, and track sales.
            </p>
            <Link
              href="/instructor/courses/new"
              className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-md shadow-blue-200/60"
            >
              Create Your First Course
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}