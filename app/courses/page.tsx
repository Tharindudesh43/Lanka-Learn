import prisma from "@/lib/prisma";
import CourseCard from "@/components/course-card";
import SearchFilters from "@/components/search-filters";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface CoursesPageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    level?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search || "";
  const categoryId = resolvedSearchParams.categoryId || "";
  const level = resolvedSearchParams.level || "";
  const minPriceStr = resolvedSearchParams.minPrice;
  const maxPriceStr = resolvedSearchParams.maxPrice;
  const sortBy = resolvedSearchParams.sortBy || "newest";
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1"));
  const pageSize = 9;

  const where: any = {
    status: "PUBLISHED",
  };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { shortDescription: { contains: search } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (level) {
    where.level = level;
  }

  const minPrice = minPriceStr ? parseFloat(minPriceStr) : null;
  const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : null;

  if (minPrice !== null || maxPrice !== null) {
    where.price = {};
    if (minPrice !== null) where.price.gte = minPrice;
    if (maxPrice !== null) where.price.lte = maxPrice;
  }

  let orderBy: any = { createdAt: "desc" };
  if (sortBy === "popular") {
    orderBy = { totalEnrollments: "desc" };
  } else if (sortBy === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sortBy === "price-desc") {
    orderBy = { price: "desc" };
  } else if (sortBy === "rating") {
    orderBy = { averageRating: "desc" };
  }

  const totalCount = await prisma.course.count({ where });
  const totalPages = Math.ceil(totalCount / pageSize);

  const courses = await prisma.course.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const dbCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          courses: {
            where: { status: "PUBLISHED" },
          },
        },
      },
    },
  });

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    courseCount: c._count.courses,
  }));

  const formattedCourses = courses.map((course) => ({
    ...course,
    price: Number(course.price),
    averageRating: Number(course.averageRating),
  }));

  const getPaginationParams = (targetPage: number) => {
    const currentParams = new URLSearchParams();
    if (search) currentParams.set("search", search);
    if (categoryId) currentParams.set("categoryId", categoryId);
    if (level) currentParams.set("level", level);
    if (minPriceStr) currentParams.set("minPrice", minPriceStr);
    if (maxPriceStr) currentParams.set("maxPrice", maxPriceStr);
    if (sortBy) currentParams.set("sortBy", sortBy);
    currentParams.set("page", targetPage.toString());
    return `?${currentParams.toString()}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white pt-28 pb-16 relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-8 border-b border-blue-100/70 pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Explore Courses
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Choose from high-rated video courses taught by independent professional instructors
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">

          <aside className="md:col-span-1">
            <SearchFilters categories={categories} />
          </aside>

          <section className="md:col-span-3">
            {formattedCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {formattedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2 flex-wrap">
                    {page > 1 && (
                      <Link
                        href={getPaginationParams(page - 1)}
                        className="rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 transition shadow-sm"
                      >
                        Previous
                      </Link>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      const isActive = p === page;
                      return (
                        <Link
                          key={p}
                          href={getPaginationParams(p)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200/60"
                              : "border border-blue-100/70 bg-white/70 backdrop-blur-sm text-slate-700 hover:bg-blue-50"
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })}

                    {page < totalPages && (
                      <Link
                        href={getPaginationParams(page + 1)}
                        className="rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 transition shadow-sm"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl text-center shadow-[0_4px_24px_rgba(59,130,246,0.06)]">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                  <BookOpen className="h-7 w-7 text-blue-300 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">
                  No courses match your criteria
                </h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  Try adjusting your keywords, price bounds, category options, or clearing filters to locate other classes.
                </p>
                <Link
                  href="/courses"
                  className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition shadow-md shadow-blue-200/60"
                >
                  Clear All Filters
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}