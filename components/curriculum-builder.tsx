"use client";

import { useState } from "react";
import {
  Plus, Trash, ArrowUp, ArrowDown, Edit, Video, FileText,
  HelpCircle, Check, Loader2, X, PlusCircle, Eye, EyeOff,
  GripVertical, ChevronDown, ChevronUp,
} from "lucide-react";
import FileUpload from "@/components/file-upload";

interface Lesson {
  id: string;
  title: string;
  type: string;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  duration: number;
  order: number;
  isFreePreview: boolean;
  sectionId: string;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CurriculumBuilderProps {
  courseId: string;
  initialSections: Section[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-3.5 w-3.5 text-blue-500" />,
  PDF: <FileText className="h-3.5 w-3.5 text-emerald-500" />,
  QUIZ: <HelpCircle className="h-3.5 w-3.5 text-purple-500" />,
};

const TYPE_COLORS: Record<string, string> = {
  VIDEO: "bg-blue-50 text-blue-700 border-blue-100",
  PDF: "bg-emerald-50 text-emerald-700 border-emerald-100",
  QUIZ: "bg-purple-50 text-purple-700 border-purple-100",
};

function formatDuration(seconds: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function CurriculumBuilder({ courseId, initialSections }: CurriculumBuilderProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [activeLesson, setActiveLesson] = useState<Partial<Lesson> | null>(null);
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [passingScore, setPassingScore] = useState(70);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshCurriculum = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      if (data.success) setSections(data.data.sections || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSection = (id: string) =>
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  // ─── Section CRUD ────────────────────────────────────────────────────────────

  const handleAddSection = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Section" }),
      });
      if (res.ok) { await refreshCurriculum(); showToast("Section added"); }
    } finally { setIsLoading(false); }
  };

  const handleRenameSection = async (sectionId: string) => {
    if (!sectionTitle.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sectionTitle }),
      });
      if (res.ok) { setEditSectionId(null); await refreshCurriculum(); showToast("Section renamed"); }
    } finally { setIsLoading(false); }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section and all its lessons?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}`, { method: "DELETE" });
      if (res.ok) { await refreshCurriculum(); showToast("Section deleted"); }
    } finally { setIsLoading(false); }
  };

  const handleMoveSection = async (index: number, dir: "up" | "down") => {
    const newSections = [...sections];
    const targetIdx = dir === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const tempOrder = newSections[index].order;
    newSections[index].order = newSections[targetIdx].order;
    newSections[targetIdx].order = tempOrder;
    [newSections[index], newSections[targetIdx]] = [newSections[targetIdx], newSections[index]];
    setSections(newSections);
    await fetch(`/api/courses/${courseId}/sections`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: newSections.map((s) => ({ id: s.id, order: s.order })) }),
    });
  };

  // ─── Lesson CRUD ─────────────────────────────────────────────────────────────

  const handleAddLesson = async (sectionId: string, type: "VIDEO" | "PDF" | "QUIZ") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `New ${type.charAt(0) + type.slice(1).toLowerCase()} Lesson`, type }),
      });
      if (res.ok) {
        await refreshCurriculum();
        showToast("Lesson added — click Edit to fill in details");
      }
    } finally { setIsLoading(false); }
  };

  const openEditModal = (lesson: Lesson) => {
    setActiveLesson({ ...lesson });
    if (lesson.type === "QUIZ" && lesson.content) {
      try {
        const parsed = JSON.parse(lesson.content);
        setQuizQuestions(parsed.questions || []);
        setPassingScore(parsed.passingScore || 70);
      } catch { setQuizQuestions([]); setPassingScore(70); }
    } else {
      setQuizQuestions([]);
      setPassingScore(70);
    }
    setIsModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!activeLesson) return;
    setSavingLesson(true);
    try {
      const body: any = {
        title: activeLesson.title,
        type: activeLesson.type,
        duration: activeLesson.duration || 0,
        isFreePreview: activeLesson.isFreePreview,
        videoUrl: activeLesson.videoUrl,
        pdfUrl: activeLesson.pdfUrl,
        content: activeLesson.content,
      };
      if (activeLesson.type === "QUIZ") {
        body.content = JSON.stringify({ questions: quizQuestions, passingScore });
      }
      const res = await fetch(
        `/api/courses/${courseId}/sections/${activeLesson.sectionId}/lessons/${activeLesson.id}`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (res.ok) {
        setIsModalOpen(false);
        setActiveLesson(null);
        await refreshCurriculum();
        showToast("Lesson saved successfully!");
      } else {
        showToast("Failed to save lesson", "error");
      }
    } finally { setSavingLesson(false); }
  };

  const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, { method: "DELETE" });
      if (res.ok) { await refreshCurriculum(); showToast("Lesson deleted"); }
    } finally { setIsLoading(false); }
  };

  const handleMoveLesson = async (sectionId: string, idx: number, dir: "up" | "down") => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const newLessons = [...section.lessons];
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newLessons.length) return;
    const tempOrder = newLessons[idx].order;
    newLessons[idx].order = newLessons[targetIdx].order;
    newLessons[targetIdx].order = tempOrder;
    [newLessons[idx], newLessons[targetIdx]] = [newLessons[targetIdx], newLessons[idx]];
    setSections(sections.map((s) => s.id === sectionId ? { ...s, lessons: newLessons } : s));
    await fetch(`/api/courses/${courseId}/sections/${sectionId}/lessons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessons: newLessons.map((l) => ({ id: l.id, order: l.order })) }),
    });
  };

  // ─── Quiz helpers ─────────────────────────────────────────────────────────────
  const addQuestion = () =>
    setQuizQuestions([...quizQuestions, {
      id: Math.random().toString(36).slice(2),
      question: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0,
      explanation: "",
    }]);

  const updateQuestion = (qi: number, field: string, val: any) =>
    setQuizQuestions(quizQuestions.map((q, i) => i === qi ? { ...q, [field]: val } : q));

  const updateOption = (qi: number, oi: number, val: string) =>
    setQuizQuestions(quizQuestions.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...q.options]; opts[oi] = val; return { ...q, options: opts };
    }));

  const removeQuestion = (qi: number) =>
    setQuizQuestions(quizQuestions.filter((_, i) => i !== qi));

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-semibold shadow-lg transition ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Curriculum Builder</h3>
          <p className="text-xs text-slate-400 mt-0.5">{sections.length} section{sections.length !== 1 ? "s" : ""} · {sections.reduce((a, s) => a + s.lessons.length, 0)} lessons</p>
        </div>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">

            {/* Section Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50/60 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
              <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                {editSectionId === section.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameSection(section.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 w-64"
                    />
                    <button onClick={() => handleRenameSection(section.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditSectionId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Section {sIdx + 1}: {section.title}
                    </span>
                    <button onClick={() => { setEditSectionId(section.id); setSectionTitle(section.title); }}
                      className="text-slate-400 hover:text-blue-500 transition">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleMoveSection(sIdx, "up")} disabled={sIdx === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-800">
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button onClick={() => handleMoveSection(sIdx, "down")} disabled={sIdx === sections.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-800">
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button onClick={() => handleDeleteSection(section.id)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400">
                  <Trash className="h-3 w-3" />
                </button>
                <button onClick={() => toggleSection(section.id)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white dark:border-slate-700 dark:hover:bg-slate-800">
                  {collapsedSections[section.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Lessons */}
            {!collapsedSections[section.id] && (
              <div className="p-4 space-y-2">
                {section.lessons.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No lessons yet. Add one below.</p>
                )}

                {section.lessons.map((lesson, lIdx) => (
                  <div key={lesson.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 transition group dark:border-slate-800 dark:bg-slate-800/20 dark:hover:bg-slate-800/60">

                    {/* Type icon */}
                    <div className={`p-1.5 rounded-lg border ${TYPE_COLORS[lesson.type]} flex-shrink-0`}>
                      {TYPE_ICONS[lesson.type]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {lIdx + 1}. {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{lesson.type}</span>
                        {lesson.duration > 0 && (
                          <span className="text-[10px] text-slate-400">{formatDuration(lesson.duration)}</span>
                        )}
                        {lesson.isFreePreview && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-semibold">Free Preview</span>
                        )}
                        {lesson.videoUrl && <span className="text-[10px] text-blue-400">• Video uploaded</span>}
                        {lesson.pdfUrl && <span className="text-[10px] text-emerald-400">• PDF uploaded</span>}
                        {lesson.type === "QUIZ" && lesson.content && (() => {
                          try { const p = JSON.parse(lesson.content!); return <span className="text-[10px] text-purple-400">• {p.questions?.length || 0} questions</span>; }
                          catch { return null; }
                        })()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                      <button onClick={() => handleMoveLesson(section.id, lIdx, "up")} disabled={lIdx === 0}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 dark:border-slate-700">
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleMoveLesson(section.id, lIdx, "down")} disabled={lIdx === section.lessons.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 dark:border-slate-700">
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button onClick={() => openEditModal(lesson)}
                        className="p-1.5 rounded-lg border border-slate-200 text-blue-500 hover:bg-blue-50 dark:border-slate-700">
                        <Edit className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDeleteLesson(section.id, lesson.id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20">
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Lesson buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => handleAddLesson(section.id, "VIDEO")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition">
                    <Video className="h-3.5 w-3.5" /> Add Video Lesson
                  </button>
                  <button onClick={() => handleAddLesson(section.id, "PDF")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-emerald-200 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 transition">
                    <FileText className="h-3.5 w-3.5" /> Add PDF Lesson
                  </button>
                  <button onClick={() => handleAddLesson(section.id, "QUIZ")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-purple-200 text-purple-600 text-xs font-semibold hover:bg-purple-50 transition">
                    <HelpCircle className="h-3.5 w-3.5" /> Add Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Section */}
      <button onClick={handleAddSection}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition dark:border-slate-800 dark:hover:border-blue-800">
        <Plus className="h-4 w-4" /> Add New Section
      </button>

      {/* ─── Edit Lesson Modal ──────────────────────────────────────────────────── */}
      {isModalOpen && activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] dark:bg-slate-900 border border-slate-100 dark:border-slate-800">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${TYPE_COLORS[activeLesson.type || "VIDEO"]}`}>
                  {TYPE_ICONS[activeLesson.type || "VIDEO"]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Edit Lesson</h4>
                  <p className="text-[10px] text-slate-400">{activeLesson.type} lesson</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Lesson Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={activeLesson.title || ""}
                  onChange={(e) => setActiveLesson({ ...activeLesson, title: e.target.value })}
                  placeholder="e.g. Introduction to Variables"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description <span className="text-slate-300">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={activeLesson.content && activeLesson.type !== "QUIZ" ? activeLesson.content : ""}
                  onChange={(e) => activeLesson.type !== "QUIZ" && setActiveLesson({ ...activeLesson, content: e.target.value })}
                  disabled={activeLesson.type === "QUIZ"}
                  placeholder="What will students learn in this lesson?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                {activeLesson.type === "QUIZ" && (
                  <p className="text-xs text-slate-400 mt-1">Description is not used for quiz lessons.</p>
                )}
              </div>

              {/* Type + Duration row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lesson Type</label>
                  <select
                    value={activeLesson.type || "VIDEO"}
                    onChange={(e) => setActiveLesson({ ...activeLesson, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-blue-500 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="VIDEO">🎥 Video Lecture</option>
                    <option value="PDF">📄 PDF Document</option>
                    <option value="QUIZ">❓ Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={activeLesson.duration || 0}
                    onChange={(e) => setActiveLesson({ ...activeLesson, duration: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-blue-500 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  />
                  {(activeLesson.duration || 0) > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">{formatDuration(activeLesson.duration || 0)}</p>
                  )}
                </div>
              </div>

              {/* Free preview toggle */}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-amber-50/40 cursor-pointer hover:bg-amber-50 transition dark:border-slate-800 dark:bg-amber-950/10">
                <input
                  type="checkbox"
                  checked={!!activeLesson.isFreePreview}
                  onChange={(e) => setActiveLesson({ ...activeLesson, isFreePreview: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Allow Free Preview</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Students can access this lesson without purchasing the course</p>
                </div>
                {activeLesson.isFreePreview
                  ? <Eye className="h-4 w-4 text-amber-500 ml-auto" />
                  : <EyeOff className="h-4 w-4 text-slate-300 ml-auto" />}
              </label>

              {/* VIDEO upload */}
              {activeLesson.type === "VIDEO" && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Video File
                  </label>
                  {activeLesson.videoUrl && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
                      <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-400 truncate flex-1">{activeLesson.videoUrl}</p>
                      <button onClick={() => setActiveLesson({ ...activeLesson, videoUrl: null })}
                        className="text-blue-400 hover:text-red-500 transition">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <FileUpload
                    onUploadComplete={(url) => {
                      setActiveLesson({ ...activeLesson, videoUrl: url });
                      showToast("Video uploaded!");
                    }}
                    folder="videos"
                    accept="video/*"
                    maxSizeMb={500}
                  />
                  <p className="text-[10px] text-slate-400">Supported formats: MP4, MOV, AVI, WebM — Max 500MB</p>
                </div>
              )}

              {/* PDF upload */}
              {activeLesson.type === "PDF" && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    PDF Document
                  </label>
                  {activeLesson.pdfUrl && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
                      <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate flex-1">{activeLesson.pdfUrl}</p>
                      <button onClick={() => setActiveLesson({ ...activeLesson, pdfUrl: null })}
                        className="text-emerald-400 hover:text-red-500 transition">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <FileUpload
                    onUploadComplete={(url) => {
                      setActiveLesson({ ...activeLesson, pdfUrl: url });
                      showToast("PDF uploaded!");
                    }}
                    folder="documents"
                    accept=".pdf,application/pdf"
                    maxSizeMb={50}
                  />
                  <p className="text-[10px] text-slate-400">PDF files only — Max 50MB</p>
                </div>
              )}

              {/* QUIZ builder */}
              {activeLesson.type === "QUIZ" && (
                <div className="space-y-4 border border-slate-100 rounded-2xl p-4 bg-purple-50/20 dark:border-slate-800 dark:bg-purple-950/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Quiz Builder</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 font-semibold uppercase">Pass %</label>
                        <input
                          type="number" min={10} max={100} value={passingScore}
                          onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <button onClick={addQuestion}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition">
                        <PlusCircle className="h-3.5 w-3.5" /> Add Question
                      </button>
                    </div>
                  </div>

                  {quizQuestions.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">No questions yet. Click "Add Question" to start.</p>
                  )}

                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {quizQuestions.map((q, qi) => (
                      <div key={q.id || qi} className="border border-slate-200 rounded-xl p-4 bg-white dark:border-slate-700 dark:bg-slate-900 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Question {qi + 1}</span>
                          <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600">
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Question text */}
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(qi, "question", e.target.value)}
                          placeholder="Enter your question here..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950"
                        />

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt: string, oi: number) => (
                            <div key={oi} className={`flex items-center gap-2 rounded-lg border p-2 ${q.correctAnswerIndex === oi ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-700"}`}>
                              <span className={`text-[10px] font-bold w-4 flex-shrink-0 ${q.correctAnswerIndex === oi ? "text-emerald-600" : "text-slate-400"}`}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(qi, oi, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                className="flex-1 text-xs outline-none bg-transparent dark:text-slate-300"
                              />
                              <button onClick={() => updateQuestion(qi, "correctAnswerIndex", oi)}
                                className={`p-0.5 rounded flex-shrink-0 ${q.correctAnswerIndex === oi ? "text-emerald-500" : "text-slate-300 hover:text-emerald-400"}`}>
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">Click ✓ on an option to mark it as the correct answer</p>

                        {/* Explanation */}
                        <input
                          type="text"
                          value={q.explanation || ""}
                          onChange={(e) => updateQuestion(qi, "explanation", e.target.value)}
                          placeholder="Explanation (shown after answering) — optional"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-slate-950 text-slate-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 flex-shrink-0">
              <p className="text-[10px] text-slate-400">Changes are saved when you click Save</p>
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </button>
                <button onClick={handleSaveLesson} disabled={savingLesson || !activeLesson.title?.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {savingLesson && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
