import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface LearnPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: LearnPageProps) {
  const { id: courseId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/auth/login?callbackUrl=/courses/${courseId}/learn`);
  }

  // 1. Verify enrollment
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
    select: { instructorId: true },
  });

  const isOwner = course && course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!enrollment && !isOwner && !isAdmin) {
    redirect(`/courses/${courseId}`);
  }

  // 2. Fetch sections and lessons in order
  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { id: true },
      },
    },
  });

  // Extract flat list of lessons
  const allLessons = sections.flatMap((s) => s.lessons);

  if (allLessons.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 flex items-center justify-center dark:bg-slate-950">
        <div className="max-w-md w-full text-center p-8 rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Classroom not ready</h3>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">
            The instructor has not added any lessons to this course syllabus yet. Please check back later!
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="mt-6 inline-block rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            Back to Course Landing Page
          </Link>
        </div>
      </main>
    );
  }

  // 3. Fetch user progress to find active lesson
  const progressList = await prisma.progress.findMany({
    where: {
      userId: session.user.id,
      enrollmentId: enrollment?.id || "",
    },
    select: {
      lessonId: true,
      completed: true,
      updatedAt: true,
    },
  });

  // Default to first lesson
  let targetLessonId = allLessons[0].id;

  // Try finding the last updated lesson that is incomplete
  const sortedProgress = [...progressList].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const lastActiveProgress = sortedProgress[0];

  if (lastActiveProgress) {
    // If they have a last active progress, let's load that lesson
    targetLessonId = lastActiveProgress.lessonId;
  } else {
    // Find the first incomplete lesson in syllabus order
    const incompleteProgress = allLessons.find((l) => {
      const p = progressList.find((prog) => prog.lessonId === l.id);
      return !p || !p.completed;
    });

    if (incompleteProgress) {
      targetLessonId = incompleteProgress.id;
    }
  }

  // Redirect to active lesson
  redirect(`/courses/${courseId}/learn/${targetLessonId}`);
}
