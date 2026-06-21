import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import CurriculumAccordion from "@/components/curriculum-accordion";
import EnrollButton from "@/components/enroll-button";
import { formatPrice, formatDurationLong, formatDate } from "@/lib/utils";
import { BookOpen, Award, Globe, Clock, BarChart, FileCheck, Star, Sparkles, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const showSuccessAlert = resolvedSearchParams.success === "true";
  const showCancelAlert = resolvedSearchParams.canceled === "true";

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          bio: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              order: true,
              isFreePreview: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  let isEnrolled = false;
  if (session) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });
    if (enrollment) {
      isEnrolled = true;
    } else if (session.user.id === course.instructorId || session.user.role === "ADMIN") {
      isEnrolled = true; // Instructor owner and Admins get enrollment bypass
    }
  }

  const reviews = await prisma.review.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  const totalLessons = course.sections.reduce((acc, sec) => acc + sec.lessons.length, 0);
  const formattedPrice = formatPrice(Number(course.price));

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white pt-28 pb-16 relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {showSuccessAlert && (
          <div className="mb-6 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 p-4 text-sm font-semibold text-emerald-700 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Payment completed successfully! You have been enrolled in the course. Proceed to your classroom.
          </div>
        )}
        {showCancelAlert && (
          <div className="mb-6 rounded-2xl bg-amber-50/80 backdrop-blur-sm border border-amber-100 p-4 text-sm font-semibold text-amber-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Payment canceled. You were not enrolled. Feel free to try check out again.
          </div>
        )}

        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-10 text-white relative overflow-hidden mb-8 shadow-lg shadow-blue-200/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            {course.category && (
              <span className="rounded-lg bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider">
                {course.category.name}
              </span>
            )}
            <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
              {course.shortDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-blue-100">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-300 stroke-amber-300" />
                <span className="font-bold text-white text-sm">{Number(course.averageRating).toFixed(1)}</span>
                <span>({course.totalReviews} reviews)</span>
              </div>
              <span className="text-blue-300">•</span>
              <span>{course.totalEnrollments.toLocaleString()} students enrolled</span>
              <span className="text-blue-300">•</span>
              <span>Created by <span className="text-white font-medium">{course.instructor.name}</span></span>
              <span className="text-blue-300">•</span>
              <span>Last updated {formatDate(course.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          <div className="lg:col-span-2 space-y-6">

            <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(59,130,246,0.06)]">
              <h2 className="text-lg font-extrabold text-slate-800 mb-4">
                Course Description
              </h2>
              <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {course.description || "No description provided."}
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(59,130,246,0.06)]">
              <h2 className="text-lg font-extrabold text-slate-800 mb-1">
                Course Curriculum
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Expand sections below to see detailed lesson listings
              </p>
              <CurriculumAccordion sections={course.sections} isEnrolled={isEnrolled} />
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(59,130,246,0.06)]">
              <h2 className="text-lg font-extrabold text-slate-800 mb-6">
                Your Instructor
              </h2>
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-blue-50 border border-blue-100">
                  {course.instructor.image ? (
                    <Image
                      src={course.instructor.image}
                      alt={course.instructor.name || "Instructor"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-600 text-xl font-bold">
                      {course.instructor.name?.[0]?.toUpperCase() || "I"}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    {course.instructor.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 mt-1">
                    {course.instructor.headline || "Professional Instructor"}
                  </p>
                  <p className="mt-3 text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                    {course.instructor.bio || "No biography provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(59,130,246,0.06)]">
              <h2 className="text-lg font-extrabold text-slate-800 mb-6">
                Student Reviews
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-blue-50 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-blue-50 border border-blue-100">
                          {review.user.image ? (
                            <Image
                              src={review.user.image}
                              alt={review.user.name || "User"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-600 text-xs font-bold">
                              {review.user.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">
                            {review.user.name || "Anonymous User"}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
                            <span className="text-[10px] font-bold text-slate-600">
                              {review.rating.toFixed(1)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-12 whitespace-pre-wrap">
                        {review.comment || "No comment left."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No student reviews yet. Be the first to review this course after enrolling!
                </div>
              )}
            </div>

          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(59,130,246,0.10)] space-y-6">

              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-blue-50 border border-blue-100/50">
                {course.thumbnail ? (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-300">
                    <BookOpen className="h-12 w-12 stroke-[1.5]" />
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500 font-semibold">Course Price:</span>
                <span className="text-2xl font-black text-blue-700">
                  {formattedPrice}
                </span>
              </div>

              <EnrollButton
                courseId={course.id}
                price={Number(course.price)}
                isEnrolled={isEnrolled}
                isAuthenticated={!!session}
              />

              <div className="border-t border-blue-50 pt-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  This course includes:
                </h3>

                <div className="space-y-3 text-xs font-semibold text-slate-700">
                  {course.totalDuration > 0 && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4.5 w-4.5 text-blue-500 stroke-[1.75]" />
                      <span>{formatDurationLong(course.totalDuration)} on-demand video</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4.5 w-4.5 text-blue-500 stroke-[1.75]" />
                    <span>{totalLessons} lessons & assignments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-4.5 w-4.5 text-blue-500 stroke-[1.75]" />
                    <span>Language: {course.language}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart className="h-4.5 w-4.5 text-blue-500 stroke-[1.75]" />
                    <span>Skill Level: {course.level.charAt(0) + course.level.slice(1).toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-4.5 w-4.5 text-blue-500 stroke-[1.75]" />
                    <span>Certificate of Completion</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}