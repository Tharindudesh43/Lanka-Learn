import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Play, FileText, HelpCircle, CheckCircle2, ChevronRight, Lock, Check } from "lucide-react";
import VideoPlayer from "@/components/video-player";
import PdfViewer from "@/components/pdf-viewer";
import QuizView from "@/components/quiz-view";
import ProgressBar from "@/components/progress-bar";
import { generateReadSasUrl, extractBlobName } from "@/lib/azure-storage";

interface LessonPageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export const dynamic = "force-dynamic";

export default async function LearnLessonPage({ params }: LessonPageProps) {
  const { id: courseId, lessonId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/auth/login?callbackUrl=/courses/${courseId}/learn/${lessonId}`);
  }

  // 1. Verify enrollment / role access
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true, instructorId: true },
  });

  if (!course) {
    notFound();
  }

  const isInstructorOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!enrollment && !isInstructorOwner && !isAdmin) {
    redirect(`/courses/${courseId}`);
  }

  // 2. Fetch full syllabus (sections + lessons)
  const sections = await prisma.section.findMany({
    where: { courseId },
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
  });

  // Extract flat list of lessons to find current, previous, and next lessons
  const allLessons = sections.flatMap((s) => s.lessons);
  const currentLessonIndex = allLessons.findIndex((l) => l.id === lessonId);

  if (currentLessonIndex === -1) {
    notFound();
  }

  // 3. Fetch current lesson details
  const currentLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });

  if (!currentLesson) {
    notFound();
  }

  // 4. Fetch student progress list
  const progressList = await prisma.progress.findMany({
    where: {
      userId: session.user.id,
      enrollmentId: enrollment?.id || "",
    },
  });

  const currentLessonProgress = progressList.find((p) => p.lessonId === lessonId);
  const completedCount = progressList.filter((p) => p.completed).length;
  const totalCount = allLessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 5. Generate secure SAS read URLs for video/PDF if configured and not mock local uploads
  let videoUrl = currentLesson.videoUrl || "";
  if (currentLesson.type === "VIDEO" && videoUrl) {
    if (!videoUrl.includes("/uploads/")) {
      try {
        videoUrl = generateReadSasUrl(extractBlobName(videoUrl));
      } catch (err) {
        console.warn("Using raw videoUrl as Azure variables are missing:", err);
      }
    }
  }

  let pdfUrl = currentLesson.pdfUrl || "";
  if (currentLesson.type === "PDF" && pdfUrl) {
    if (!pdfUrl.includes("/uploads/")) {
      try {
        pdfUrl = generateReadSasUrl(extractBlobName(pdfUrl));
      } catch (err) {
        console.warn("Using raw pdfUrl as Azure variables are missing:", err);
      }
    }
  }

  // Prev/Next lesson navigation helpers
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Play className="h-3.5 w-3.5" />;
      case "PDF":
        return <FileText className="h-3.5 w-3.5" />;
      case "QUIZ":
        return <HelpCircle className="h-3.5 w-3.5" />;
      default:
        return <Play className="h-3.5 w-3.5" />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row pt-20">
      
      {/* ─── Classroom Sidebar ─── */}
      <aside className="w-full md:w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 md:h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-5 border-b border-slate-800">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-semibold"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Course Info
          </Link>
          <h2 className="mt-3 text-sm font-extrabold text-white leading-tight line-clamp-2">
            {course.title}
          </h2>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xxs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>Your Progress</span>
              <span>{completedCount}/{totalCount} Complete</span>
            </div>
            <ProgressBar progress={progressPercent} size="sm" />
          </div>
        </div>

        {/* Syllabus Navigation list */}
        <div className="flex-1 py-4 space-y-4">
          {sections.map((section, sIdx) => (
            <div key={section.id} className="px-3">
              <h4 className="px-3 text-xxs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Section {sIdx + 1}: {section.title}
              </h4>
              <div className="space-y-1">
                {section.lessons.map((lesson) => {
                  const isActive = lesson.id === lessonId;
                  const isCompleted = progressList.find((p) => p.lessonId === lesson.id)?.completed;

                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${courseId}/learn/${lesson.id}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
                      }`}
                    >
                      {isCompleted ? (
                        <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-950/40 shrink-0">
                          <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                        </div>
                      ) : (
                        <div className={`flex h-4.5 w-4.5 items-center justify-center shrink-0`}>
                          {getLessonIcon(lesson.type)}
                        </div>
                      )}
                      <span className="flex-1 truncate leading-none mt-0.5">{lesson.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ─── Classroom Viewer Main Content ─── */}
      <section className="flex-1 bg-slate-900 flex flex-col md:h-[calc(100vh-80px)] overflow-y-auto">
        <div className="flex-1 p-6 sm:p-8 flex flex-col max-w-4xl mx-auto w-full space-y-6 justify-center">
          
          {/* Content Head */}
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xxs font-bold uppercase tracking-widest text-blue-400">
              Lesson {currentLessonIndex + 1} of {totalCount}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1 leading-snug">
              {currentLesson.title}
            </h1>
          </div>

          {/* Classroom Player body */}
          <div className="flex-1 flex items-center justify-center">
            {currentLesson.type === "VIDEO" && videoUrl ? (
              <VideoPlayer
                url={videoUrl}
                lessonId={currentLesson.id}
                initialWatchedSeconds={currentLessonProgress?.watchedSeconds || 0}
              />
            ) : currentLesson.type === "PDF" && pdfUrl ? (
              <PdfViewer
                url={pdfUrl}
                lessonId={currentLesson.id}
                isCompleted={currentLessonProgress?.completed || false}
              />
            ) : currentLesson.type === "QUIZ" && currentLesson.content ? (
              <QuizView
                contentJson={currentLesson.content}
                lessonId={currentLesson.id}
                isCompleted={currentLessonProgress?.completed || false}
              />
            ) : (
              <div className="p-8 text-center bg-slate-850 rounded-2xl max-w-sm border border-slate-800 text-slate-400 text-xs">
                No playable content is configured for this lesson.
              </div>
            )}
          </div>

          {/* Navigation Controls footer */}
          <div className="flex items-center justify-between border-t border-slate-850 pt-6">
            {prevLesson ? (
              <Link
                href={`/courses/${courseId}/learn/${prevLesson.id}`}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Lesson
              </Link>
            ) : (
              <span className="text-xs text-slate-600 font-bold">First Lesson</span>
            )}

            {nextLesson ? (
              <Link
                href={`/courses/${courseId}/learn/${nextLesson.id}`}
                className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
              >
                Next Lesson
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-xs text-slate-600 font-bold">Course Completed</span>
            )}
          </div>

        </div>
      </section>

    </main>
  );
}
