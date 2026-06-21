// app/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import ProgressBar from "@/components/progress-bar";
import Link from "next/link";
import { BookOpen, PlayCircle, GraduationCap, Compass, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login?callbackUrl=/dashboard");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          instructor: { select: { name: true, image: true } },
          sections: { select: { lessons: { select: { id: true } } } },
        },
      },
      progress: {
        select: {
          completed: true,
          updatedAt: true,
          lesson: { select: { id: true, title: true, sectionId: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const enrolledCourses = enrollments.map((enrollment: { enrolledAt?: any; completedAt?: any; course?: any; progress?: any; }) => {
    const { course, progress } = enrollment;
    const totalLessons = course.sections.reduce((acc: any, sec: { lessons: string | any[]; }) => acc + sec.lessons.length, 0);
    const completedLessons = progress.filter((p) => p.completed).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    let lastAccessedLesson = undefined;
    if (progress.length > 0) {
      const sorted = [...progress].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      if (sorted[0]?.lesson) lastAccessedLesson = sorted[0].lesson;
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      instructor: course.instructor,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      progress: progressPercent,
      totalLessons,
      completedLessons,
      lastAccessedLesson,
    };
  });

  const resumeCourse = enrolledCourses[0];
  const totalCompleted = enrolledCourses.filter((c) => c.progress === 100).length;
  const avgProgress = enrolledCourses.length
    ? Math.round(enrolledCourses.reduce((a: any, c: { progress: any; }) => a + c.progress, 0) / enrolledCourses.length)
    : 0;

  return (
    <div className="space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Welcome back, {session.user.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pick up right where you left off
          </p>
        </div>

        {enrolledCourses.length > 0 && (
          <div className="flex gap-4 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
              <p className="text-lg font-black text-slate-900">{enrolledCourses.length}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Enrolled</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
              <p className="text-lg font-black text-blue-600">{avgProgress}%</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Progress</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
              <p className="text-lg font-black text-emerald-600">{totalCompleted}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
            </div>
          </div>
        )}
      </div>

      {resumeCourse && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white blur-2xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" /> Continue Studying
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight line-clamp-2">
                {resumeCourse.title}
              </h2>
              <p className="text-sm text-blue-100">
                {resumeCourse.lastAccessedLesson
                  ? `Last lesson: ${resumeCourse.lastAccessedLesson.title}`
                  : "Start the first lesson to begin"}
              </p>
              <div className="max-w-xs pt-1">
                <div className="flex justify-between text-[10px] font-bold text-blue-200 mb-1.5">
                  <span>Progress</span>
                  <span>{resumeCourse.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${resumeCourse.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              href={
                resumeCourse.lastAccessedLesson
                  ? `/courses/${resumeCourse.id}/learn/${resumeCourse.lastAccessedLesson.id}`
                  : `/courses/${resumeCourse.id}/learn`
              }
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-blue-700 hover:bg-blue-50 transition shrink-0 shadow-sm"
            >
              <PlayCircle className="h-4 w-4" />
              Resume Learning
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-4">
          My Enrolled Courses
          <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            ({enrolledCourses.length})
          </span>
        </h2>

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                      <BookOpen className="h-10 w-10 stroke-[1.5]" />
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 rounded-lg bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
                    {course.progress}%
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-bold text-slate-800 leading-snug">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    By {course.instructor.name || "Instructor"}
                  </p>

                  <div className="mt-4 flex-1 flex flex-col justify-end gap-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1.5">
                        <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                        <span className={course.progress === 100 ? "text-emerald-600" : "text-blue-500"}>
                          {course.progress === 100 ? "Complete ✓" : `${course.progress}%`}
                        </span>
                      </div>
                      <ProgressBar progress={course.progress} size="sm" />
                    </div>

                    <Link
                      href={
                        course.lastAccessedLesson
                          ? `/courses/${course.id}/learn/${course.lastAccessedLesson.id}`
                          : `/courses/${course.id}/learn`
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-100 hover:text-blue-700 transition-colors"
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      Go to Classroom
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Compass className="h-8 w-8 text-slate-300 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No courses yet</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Browse our marketplace to find courses taught by real practitioners and start learning today.
            </p>
            <Link
              href="/courses"
              className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm"
            >
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}