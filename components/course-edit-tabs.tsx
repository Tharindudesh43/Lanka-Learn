"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Info, ListTodo, Check, Send, Sparkles, Loader2 } from "lucide-react";
import CourseForm from "@/components/course-form";
import CurriculumBuilder from "@/components/curriculum-builder";
import { CategoryItem } from "@/types";

interface CourseEditTabsProps {
  courseId: string;
  courseData: any;
  categories: CategoryItem[];
  sections: any[];
}

export default function CourseEditTabs({
  courseId,
  courseData,
  categories,
  sections,
}: CourseEditTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "curriculum">("info");
  const [status, setStatus] = useState<string>(courseData.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const lessonsCount = sections.reduce((sum, sec) => sum + sec.lessons.length, 0);
  const hasThumbnail = !!courseData.thumbnail;
  const hasLessons = lessonsCount > 0;
  const isReadyForReview = hasThumbnail && hasLessons && courseData.description;

  const handleSubmitForReview = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING_REVIEW" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit course");
      }

      setStatus("PENDING_REVIEW");
      setSuccess("Your course has been submitted for administration review!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "DRAFT":
        return "Draft Mode (Invisible to Students)";
      case "PENDING_REVIEW":
        return "Under Moderation Review";
      case "PUBLISHED":
        return "Live on Marketplace";
      case "REJECTED":
        return "Rejected by Moderation";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="rounded-2xl bg-slate-100 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:bg-slate-900/60 dark:border dark:border-slate-850">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Status
          </span>
          <p className="text-sm font-bold text-white mt-0.5">{getStatusText()}</p>
        </div>

        {status === "DRAFT" && (
          <button
            onClick={handleSubmitForReview}
            disabled={!isReadyForReview || isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit for Admin Review
          </button>
        )}

        {status === "PENDING_REVIEW" && (
          <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-3.5 py-2 rounded-lg border border-amber-400/20">
            Awaiting administrator approval...
          </span>
        )}

        {status === "PUBLISHED" && (
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3.5 py-2 rounded-lg border border-emerald-400/20 flex items-center gap-1.5">
            <Check className="h-4 w-4" /> Published
          </span>
        )}
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800">{error}</div>}
      {success && <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4 text-xs font-semibold text-emerald-800">{success}</div>}

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === "info"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Info className="h-4 w-4" />
          Course Information
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === "curriculum"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Course Curriculum ({lessonsCount})
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-850 dark:bg-slate-900">
        {activeTab === "info" ? (
          <CourseForm categories={categories} initialData={courseData} />
        ) : (
          <CurriculumBuilder courseId={courseId} initialSections={sections} />
        )}
      </div>

    </div>
  );
}
