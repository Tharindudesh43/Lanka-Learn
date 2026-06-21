"use client";

import { useState } from "react";
import { ChevronDown, Video, FileText, HelpCircle, Lock, Play, Check } from "lucide-react";
import { SectionWithLessons, LessonSummary } from "@/types";
import { formatDuration } from "@/lib/utils";

interface CurriculumAccordionProps {
  sections: SectionWithLessons[];
  isEnrolled: boolean;
  onPreviewLesson?: (lessonId: string) => void;
}

export default function CurriculumAccordion({
  sections,
  isEnrolled,
  onPreviewLesson,
}: CurriculumAccordionProps) {
  // Keep track of which section IDs are expanded (defaults to first expanded)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (sections.length > 0) {
      return { [sections[0].id]: true };
    }
    return {};
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "PDF":
        return <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "QUIZ":
        return <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const totalLessons = sections.reduce((acc, sec) => acc + sec.lessons.length, 0);

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-150 p-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
        No curriculum sections have been added to this course yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-550 dark:text-slate-400">
        <span>
          {sections.length} section{sections.length !== 1 ? "s" : ""} • {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
        </span>
      </div>

      {sections.map((section, idx) => {
        const isExpanded = !!expandedSections[section.id];
        const sectionDuration = section.lessons.reduce((sum, les) => sum + les.duration, 0);

        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-xl border border-slate-150 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between bg-slate-50/50 p-4 text-left transition hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/40"
            >
              <div className="flex-1 pr-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Section {idx + 1}: {section.title}
                </h4>
                <div className="mt-1 text-xs text-slate-450 dark:text-slate-500">
                  {section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""} •{" "}
                  {formatDuration(sectionDuration)}
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform duration-250 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Section Lessons List */}
            <div
              className={`transition-all duration-200 ${
                isExpanded ? "max-h-[1000px] border-t border-slate-100 dark:border-slate-800" : "max-h-0 overflow-hidden"
              }`}
            >
              <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {section.lessons.map((lesson) => {
                  const hasAccess = isEnrolled || lesson.isFreePreview;

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/40 dark:hover:bg-slate-950/10"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        {/* Status Icon */}
                        {isEnrolled && lesson.isCompleted ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          </div>
                        ) : (
                          getLessonIcon(lesson.type)
                        )}
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-450">
                          {lesson.order}.
                        </span>
                        <span className="text-sm font-medium text-slate-750 dark:text-slate-300">
                          {lesson.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {lesson.duration > 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatDuration(lesson.duration)}
                          </span>
                        )}

                        {/* Lock / Play Control */}
                        {hasAccess ? (
                          lesson.isFreePreview && !isEnrolled && onPreviewLesson ? (
                            <button
                              onClick={() => onPreviewLesson(lesson.id)}
                              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 transition dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            >
                              <Play className="h-3 w-3 fill-blue-600 dark:fill-blue-400" />
                              Preview
                            </button>
                          ) : (
                            <span className="text-xxs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Access
                            </span>
                          )
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
