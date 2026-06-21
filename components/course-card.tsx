import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, Star, ArrowRight } from "lucide-react";
import { CourseListItem } from "@/types";
import { formatPrice, formatDuration } from "@/lib/utils";

interface CourseCardProps {
  course: CourseListItem;
}

export default function CourseCard({ course }: CourseCardProps) {
  const {
    id,
    title,
    slug,
    shortDescription,
    thumbnail,
    price,
    level,
    averageRating,
    totalEnrollments,
    totalReviews,
    totalDuration,
    instructor,
    category,
  } = course;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(59,130,246,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_12px_32px_rgba(59,130,246,0.14)]">
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-blue-300">
            <BookOpen className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {category && (
            <span className="rounded-lg bg-blue-600/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white">
              {category.name}
            </span>
          )}
          <span className="rounded-lg bg-white/70 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-slate-700">
            {level.charAt(0) + level.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <span className="mb-2 text-xs font-medium text-slate-400">
          By {instructor.name || "Instructor"}
        </span>
        <h3 className="mb-2 line-clamp-2 text-base font-bold text-slate-800 transition-colors group-hover:text-blue-600">
          <Link href={`/courses/${id}`}>
            <span className="absolute inset-0" aria-hidden="true" />
            {title}
          </Link>
        </h3>
        <p className="mb-4 line-clamp-2 flex-1 text-xs text-slate-500">
          {shortDescription || "No description provided."}
        </p>

        <div className="mb-4 flex items-center justify-between border-b border-blue-50 pb-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
            <span className="font-bold text-slate-700">{averageRating.toFixed(1)}</span>
            <span>({totalReviews})</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 stroke-[1.75]" />
            <span>{totalEnrollments.toLocaleString()} students</span>
          </div>
          {totalDuration > 0 && (
            <div>
              <span>{formatDuration(totalDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-blue-700">
            {formatPrice(price)}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors group-hover:text-blue-700">
            Learn More
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}