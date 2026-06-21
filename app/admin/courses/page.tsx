"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, Search, CheckCircle, XCircle, Clock,
  ChevronLeft, ChevronRight, Trash2, RefreshCw, AlertTriangle
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  level: string;
  totalEnrollments: number;
  createdAt: string;
  updatedAt: string;
  instructor: { id: string; name: string | null; email: string };
  category: { id: string; name: string } | null;
  rejectionReason: string | null;
}

interface TabCounts {
  ALL: number;
  PENDING_REVIEW: number;
  PUBLISHED: number;
  DRAFT: number;
  REJECTED: number;
}

const TABS = [
  { key: "ALL",            label: "All",            color: "text-slate-600",   active: "border-slate-700 text-slate-900",   dot: "bg-slate-400"   },
  { key: "PENDING_REVIEW", label: "Pending Review", color: "text-amber-600",   active: "border-amber-500 text-amber-700",   dot: "bg-amber-400"   },
  { key: "PUBLISHED",      label: "Published",      color: "text-emerald-600", active: "border-emerald-500 text-emerald-700", dot: "bg-emerald-400" },
  { key: "DRAFT",          label: "Draft",          color: "text-slate-500",   active: "border-slate-400 text-slate-600",   dot: "bg-slate-300"   },
  { key: "REJECTED",       label: "Rejected",       color: "text-red-500",     active: "border-red-500 text-red-600",       dot: "bg-red-400"     },
];

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED:      "bg-emerald-100 text-emerald-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  DRAFT:          "bg-slate-100 text-slate-500",
  REJECTED:       "bg-red-100 text-red-600",
};

const STATUS_OPTIONS = ["PUBLISHED", "PENDING_REVIEW", "DRAFT", "REJECTED"];

export default function AdminCoursesPage() {
  const [courses, setCourses]         = useState<Course[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState("PENDING_REVIEW");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [counts, setCounts]           = useState<TabCounts>({ ALL: 0, PENDING_REVIEW: 0, PUBLISHED: 0, DRAFT: 0, REJECTED: 0 });
  const [acting, setActing]           = useState<string | null>(null);

  const [rejectModal, setRejectModal] = useState<{ courseId: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ courseId: string; title: string } | null>(null);
  const [statusModal, setStatusModal] = useState<{ courseId: string; title: string; current: string } | null>(null);
  const [newStatus, setNewStatus]     = useState("");

  async function fetchCourses() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (search) params.set("search", search);
      if (activeTab !== "ALL") params.set("status", activeTab);
      const res = await fetch(`/api/admin/courses?${params}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.data);
        setTotalPages(data.pagination.totalPages);
        setCounts((prev) => ({ ...prev, [activeTab]: data.pagination.totalCount }));
      }
    } finally {
      setLoading(false);
    }
  }


  async function fetchCounts() {
    const statuses = ["ALL", "PENDING_REVIEW", "PUBLISHED", "DRAFT", "REJECTED"];
    const results = await Promise.all(
      statuses.map(async (s) => {
        const params = new URLSearchParams({ page: "1", pageSize: "1" });
        if (s !== "ALL") params.set("status", s);
        const res = await fetch(`/api/admin/courses?${params}`);
        const data = await res.json();
        return [s, data.success ? data.pagination.totalCount : 0] as [string, number];
      })
    );
    setCounts(Object.fromEntries(results) as TabCounts);
  }


  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { fetchCourses(); }, [page, activeTab]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchCourses(); }, 400);
    return () => clearTimeout(t);
  }, [search]);


  function switchTab(key: string) {
    setActiveTab(key);
    setPage(1);
  }

  
  async function updateStatus(courseId: string, status: string, rejectionReason?: string) {
    setActing(courseId);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, status, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        fetchCounts();
      }
    } finally {
      setActing(null);
      setRejectModal(null);
      setRejectReason("");
      setStatusModal(null);
      setNewStatus("");
    }
  }

  async function deleteCourse(courseId: string) {
    setActing(courseId);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        fetchCounts();
      }
    } finally {
      setActing(null);
      setDeleteModal(null);
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            Course Moderation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, approve, reject, or delete courses across all statuses
          </p>
        </div>
        <button
          onClick={() => { fetchCourses(); fetchCounts(); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="border-b border-slate-100 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key as keyof TabCounts] ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap
                  ${isActive
                    ? `${tab.active} bg-white`
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab.dot}`} />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold
                  ${isActive ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by title or instructor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
          <Clock className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No courses in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-sm">{course.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[course.status] || "bg-slate-100 text-slate-500"}`}>
                      {course.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2">
                    <span>By <span className="font-medium text-slate-600">{course.instructor.name || course.instructor.email}</span></span>
                    {course.category && <span>· {course.category.name}</span>}
                    <span>· {course.level}</span>
                    <span>· ${course.price.toFixed(2)}</span>
                    <span>· {course.totalEnrollments} enrolled</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Updated {new Date(course.updatedAt).toLocaleDateString()}
                  </p>
                  {course.rejectionReason && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {course.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {course.status !== "PUBLISHED" && (
                    <button
                      onClick={() => updateStatus(course.id, "PUBLISHED")}
                      disabled={acting === course.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {acting === course.id ? "…" : "Approve"}
                    </button>
                  )}

                  {course.status !== "REJECTED" && (
                    <button
                      onClick={() => setRejectModal({ courseId: course.id, title: course.title })}
                      disabled={acting === course.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}

                  <button
                    onClick={() => { setStatusModal({ courseId: course.id, title: course.title, current: course.status }); setNewStatus(course.status); }}
                    disabled={acting === course.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Status
                  </button>

                  <button
                    onClick={() => setDeleteModal({ courseId: course.id, title: course.title })}
                    disabled={acting === course.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 mb-1">Reject Course</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">"{rejectModal.title}"</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)…"
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold text-slate-600">
                Cancel
              </button>
              <button onClick={() => updateStatus(rejectModal.courseId, "REJECTED", rejectReason)}
                className="flex-1 px-4 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Delete Course</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 line-clamp-2">
              "{deleteModal.title}"
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold text-slate-600">
                Cancel
              </button>
              <button
                onClick={() => deleteCourse(deleteModal.courseId)}
                disabled={acting === deleteModal.courseId}
                className="flex-1 px-4 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold disabled:opacity-60"
              >
                {acting === deleteModal.courseId ? "Deleting…" : "Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 mb-1">Change Status</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">"{statusModal.title}"</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all
                    ${newStatus === s
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                    }`}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStatusModal(null)}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold text-slate-600">
                Cancel
              </button>
              <button
                onClick={() => updateStatus(statusModal.courseId, newStatus)}
                disabled={newStatus === statusModal.current || acting === statusModal.courseId}
                className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {acting === statusModal.courseId ? "Saving…" : "Apply Status"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}