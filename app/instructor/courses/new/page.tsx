import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseForm from "@/components/course-form";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/instructor/courses/new");
  }

  // Double check role
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch categories for selector
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100">
          Create New Course
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 dark:text-slate-400">
          Set up your course metadata. You will build sections and publish lectures on the next screen.
        </p>
      </div>

      {/* Form Container */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-850 dark:bg-slate-900">
        <CourseForm categories={categories} />
      </div>

    </div>
  );
}
