"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, DollarSign, Image as ImageIcon, Loader2 } from "lucide-react";
import { CategoryItem, CourseLevel } from "@/types";
import FileUpload from "@/components/file-upload";

interface CourseFormProps {
  categories: CategoryItem[];
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    shortDescription: string | null;
    price: number;
    categoryId: string | null;
    level: string;
    language: string;
    thumbnail: string | null;
  };
}

export default function CourseForm({ categories, initialData }: CourseFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price !== undefined ? initialData.price.toString() : "0");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [level, setLevel] = useState(initialData?.level || "BEGINNER");
  const [language, setLanguage] = useState(initialData?.language || "English");
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || "");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");

      const body = {
        title,
        shortDescription,
        description,
        price: parseFloat(price) || 0,
        categoryId: categoryId || null,
        level,
        language,
        thumbnail,
      };

      const url = isEditing ? `/api/courses/${initialData.id}` : "/api/courses";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save course data");
      }

      router.push(isEditing ? `/instructor/courses/${initialData.id}/edit` : `/instructor/courses/${data.data.id}/edit`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50/80 backdrop-blur border border-red-100 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Columns - Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Course Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js 16 Fullstack Course for Beginners"
              className="w-full rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm p-3 text-xs text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Learn layout architecture, Server Components, and database setups with Prisma."
              className="w-full rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm p-3 text-xs text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Full Description
            </label>
            <textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive syllabus summary and details about lessons..."
              className="w-full rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm p-3 text-xs text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition leading-relaxed"
            />
          </div>

          {/* Grid of level, category, price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm p-3 text-xs text-slate-800 shadow-sm focus:border-blue-400 outline-none cursor-pointer"
              >
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Skill Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm p-3 text-xs text-slate-800 shadow-sm focus:border-blue-400 outline-none cursor-pointer"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm py-3 pr-4 pl-10 text-xs text-slate-800 shadow-sm focus:border-blue-400 outline-none"
                />
                <DollarSign className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-blue-300" />
              </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Teaching Language
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. English, Spanish"
              className="w-full rounded-xl border border-blue-100/70 bg-white/70 backdrop-blur-sm p-3 text-xs text-slate-800 shadow-sm focus:border-blue-400 outline-none transition"
            />
          </div>
        </div>

        {/* Right Column - Thumbnail Image Upload */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Course Cover Image
            </label>
            <div className="space-y-4">
              {thumbnail ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 shadow-sm">
                  <img src={thumbnail} alt="Cover Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute top-2 right-2 rounded-lg bg-red-500/90 backdrop-blur hover:bg-red-600 px-2 py-1 text-[10px] font-bold text-white transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 backdrop-blur-sm text-blue-300">
                  <ImageIcon className="h-10 w-10 stroke-[1.5]" />
                </div>
              )}

              <FileUpload
                onUploadComplete={(url) => setThumbnail(url)}
                folder="thumbnails"
                accept="image/*"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-200/60 transition disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Course...
                </>
              ) : isEditing ? (
                "Save Course Info"
              ) : (
                "Create Course & Next"
              )}
            </button>
          </div>
        </div>

      </div>
    </form>
  );
}