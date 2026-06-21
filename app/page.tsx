
import Link from "next/link";
import CourseCard from "@/components/course-card";
import {
  BookOpen,
  Award,
  ShieldCheck,
  Users,
  ArrowRight,
  Search,
  Star,
  TrendingUp,
  Globe,
  Code,
  Palette,
  BarChart2,
  Music,
  Camera,
  Cpu,
} from "lucide-react";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export default async function HomePage() {

  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    take: 6,
    orderBy: { totalEnrollments: "desc" },
    include: {
      instructor: {
        select: { id: true, name: true, image: true, headline: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  const categories = await prisma.category.findMany({
    take: 8,
    include: {
      _count: {
        select: { courses: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });
  const totalCourses = await prisma.course.count({ where: { status: "PUBLISHED" } });
  const totalInstructors = await prisma.user.count({ where: { role: "INSTRUCTOR" } });

  const formattedCourses = courses.map((course) => ({
    ...course,
    price: Number(course.price),
    averageRating: Number(course.averageRating),
  }));

  const STATS = [
    { value: `${totalCourses}+`, label: "Expert Courses" },
    { value: `${totalInstructors}+`, label: "Instructors" },
    { value: `${totalStudents + 120}+`, label: "Active Students" },
    { value: "4.8★", label: "Avg. Rating" },
  ];

  const TRENDING = ["Next.js", "Python", "UI/UX Design", "AI Integration", "Cloud Architecture"];

  // useEffect(() => { 
  //   // Prefetch courses page for faster navigation
  //   console.log(courses);
  // }, []);

  return (
    <main className="min-h-screen bg-white">

      <section className="relative pt-28 pb-24 px-4 text-center bg-[#F7F8FC] border-b border-slate-100">

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-violet-100/40 blur-[120px]" />
          <div className="absolute top-10 right-0 w-[300px] h-[300px] rounded-full bg-blue-100/30 blur-[80px]" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-[2.6rem] sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
            Skills that take you{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-blue-600">further</span>
              {/* Underline accent */}
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="6"
                viewBox="0 0 200 6"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M0 5 Q50 0 100 4 Q150 8 200 3"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="text-slate-500 text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Curated courses from practitioners — not lecturers. Learn at your pace, track your progress, and land your next role.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center max-w-[500px] mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden focus-within:border-violet-300 focus-within:shadow-violet-100/60 focus-within:shadow-md transition-all p-1.5 gap-1.5">
            <div className="flex flex-1 items-center px-3 gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search for a skill, topic, or tool…"
                className="w-full text-slate-800 placeholder-slate-400 py-2 text-sm outline-none bg-transparent"
              />
            </div>
            <Link
              href="/courses"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors text-center whitespace-nowrap"
            >
              Browse Courses
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-center mt-6">
            <span className="text-xs text-slate-400 font-medium">Trending:</span>
            {TRENDING.map((tag) => (
              <Link
                key={tag}
                href={`/courses?search=${encodeURIComponent(tag)}`}
                className="bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 text-xs px-3 py-1 rounded-full transition-all"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-wrap divide-x divide-slate-100 justify-center">
          {STATS.map((s) => (
            <div key={s.label} className="flex-1 min-w-[110px] text-center px-4 py-3">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="flex items-end justify-between mb-9">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-600 mb-2">Browse by topic</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Top Categories</h2>
          </div>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-violet-600 transition-colors"
          >
            All topics <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/courses?categoryId=${cat.id}`}
              className="group flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/40 transition-all duration-200"
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-50 group-hover:bg-violet-100 border border-slate-100 group-hover:border-violet-200 flex items-center justify-center text-slate-500 group-hover:text-violet-600 transition-all">
                {cat.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-violet-700 transition-colors truncate">
                  {cat.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{cat._count?.courses ?? 0} courses</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-9 gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-600 mb-2">Hand-picked</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Featured Courses</h2>
          </div>
          <Link
            href="/courses"
            className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors"
          >
            Explore all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {formattedCourses.map((course) => (
            <CourseCard key={course.id} course={course as any} />
          ))}
        </div>
      </section>

      {/* <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-600 mb-2">Why LearnHub</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Built for serious learners</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-100 bg-[#FAFBFE] hover:border-slate-200 hover:bg-white transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm text-slate-800 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="bg-blue-600 py-20 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-blue-200 text-xs font-bold tracking-[0.18em] uppercase mb-3">Get started today</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
            Ready to start learning?
          </h2>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            Join 52,000+ students already building in-demand skills with world-class instructors.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-700 font-semibold text-sm px-7 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 border border-blue-400 text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-colors"
            >
              Become an Instructor
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}