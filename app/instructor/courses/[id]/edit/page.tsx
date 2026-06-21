import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CourseEditTabs from "@/components/course-edit-tabs";

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/auth/login?callbackUrl=/instructor/courses/${id}/edit`);
  }

  // 1. Fetch course details
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // 2. Authorization check: instructor owner or admin
  if (course.instructorId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 3. Fetch category list for selectors
  const dbCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
  }));

  // Structure course details for CourseForm compatibility
  const courseData = {
    id: course.id,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    price: Number(course.price),
    categoryId: course.categoryId,
    level: course.level,
    language: course.language,
    thumbnail: course.thumbnail,
    status: course.status,
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-black ">
          Edit Course Curriculum
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 dark:text-slate-400">
          Update your syllabus, upload lecture files/videos, or create multiple choice quizzes
        </p>
      </div>

      <CourseEditTabs
        courseId={course.id}
        courseData={courseData}
        categories={categories}
        sections={course.sections}
      />

    </div>
  );
}
