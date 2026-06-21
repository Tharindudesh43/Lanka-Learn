"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { CategoryItem } from "@/types";

interface SearchFiltersProps {
  categories: CategoryItem[];
}

export default function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") || "");
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get("level") || "");
  const [priceType, setPriceType] = useState(searchParams.get("priceType") || "all"); // all, free, paid
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync state with URL search params when they change
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("categoryId") || "");
    setSelectedLevel(searchParams.get("level") || "");
    setPriceType(searchParams.get("priceType") || "all");
    setSortBy(searchParams.get("sortBy") || "newest");
  }, [searchParams]);

  // Apply filters by pushing new query string
  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset page on filter changes
    params.delete("page");

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedLevel("");
    setPriceType("all");
    setSortBy("newest");
    
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="w-full">
      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative mb-6">
        <input
          type="text"
          placeholder="Search for courses, skills, or instructors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-12 pl-12 text-sm text-slate-800 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-150 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-600 dark:focus:ring-blue-900/40"
        />
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <button
          type="submit"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>

      {/* Mobile Filters Toggle & Sorting */}
      <div className="mb-6 flex items-center justify-between gap-4 md:hidden">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>

        <select
          value={sortBy}
          onChange={(e) => applyFilters({ sortBy: e.target.value })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {/* Desktop Filter Sidebar / Mobile Collapsible Panel */}
      <div
        className={`${
          showMobileFilters ? "block" : "hidden"
        } md:block space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Filter Courses</h3>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition dark:text-slate-400 dark:hover:text-blue-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
          </button>
        </div>

        {/* Sort By (Desktop only) */}
        <div className="hidden md:block">
          <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => applyFilters({ sortBy: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="newest">Newest first</option>
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {/* Categories */}
        <div>
          <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Category
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === ""}
                onChange={() => applyFilters({ categoryId: null })}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800"
              />
              <span>All Categories</span>
            </label>
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350 cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat.id}
                  onChange={() => applyFilters({ categoryId: cat.id })}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800"
                />
                <span className="flex-1 truncate">{cat.name}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xxs font-bold text-slate-450 dark:bg-slate-800 dark:text-slate-500">
                  {cat.courseCount ?? 0}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Level */}
        <div>
          <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Price Type
          </label>
          <div className="space-y-2">
            {[
              { label: "All Prices", value: "all", min: null, max: null },
              { label: "Free Courses", value: "free", min: "0", max: "0" },
              { label: "Paid Courses", value: "paid", min: "0.01", max: null },
            ].map((p) => (
              <label
                key={p.value}
                className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350 cursor-pointer"
              >
                <input
                  type="radio"
                  name="priceType"
                  checked={priceType === p.value}
                  onChange={() => {
                    setPriceType(p.value);
                    applyFilters({
                      priceType: p.value,
                      minPrice: p.min,
                      maxPrice: p.max,
                    });
                  }}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Course Levels */}
        <div>
          <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Level
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350 cursor-pointer">
              <input
                type="radio"
                name="level"
                checked={selectedLevel === ""}
                onChange={() => applyFilters({ level: null })}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800"
              />
              <span>All Levels</span>
            </label>
            {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => (
              <label
                key={lvl}
                className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350 cursor-pointer"
              >
                <input
                  type="radio"
                  name="level"
                  checked={selectedLevel === lvl}
                  onChange={() => applyFilters({ level: lvl })}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800"
                />
                <span>{lvl.charAt(0) + lvl.slice(1).toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {isPending && (
          <div className="flex items-center justify-center pt-2 text-xs text-blue-600 font-semibold dark:text-blue-400">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Filtering...
          </div>
        )}
      </div>
    </div>
  );
}
