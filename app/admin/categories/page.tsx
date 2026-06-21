"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Edit2, Trash2, X, Loader2, BookOpen, AlertCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  courseCount: number;
  createdAt: string;
}

const EMOJI_SUGGESTIONS = ["💻", "📱", "📊", "🤖", "🎨", "☁️", "🔒", "💼", "📷", "🎓", "🧪", "📚"];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  async function fetchCategories() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error || "Failed to load categories");
      }
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCategories(); }, []);

  function openCreateModal() {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setIcon(cat.icon || "");
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Category name is required");
      return;
    }
    setSaving(true);
    setFormError("");

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, icon }),
      });
      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || "Something went wrong");
        setSaving(false);
        return;
      }

      setModalOpen(false);
      await fetchCategories();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setDeleteError({ id, message: data.error || "Failed to delete" });
        setDeletingId(null);
        return;
      }
      await fetchCategories();
    } catch {
      setDeleteError({ id, message: "Network error. Please try again." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white -m-5 sm:-m-8 p-5 sm:p-8 relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative space-y-6 max-w-5xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              <Tag className="h-6 w-6 text-blue-500" />
              Categories
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage course categories shown across the platform
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200/60 transition"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50/80 backdrop-blur border border-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-dashed border-blue-200 bg-white/60 backdrop-blur-xl text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <Tag className="h-7 w-7 text-blue-400 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No categories yet</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
              Categories help students browse courses by topic. Create your first one to get started.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-md shadow-blue-200/60"
            >
              Add Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(59,130,246,0.06)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)] hover:border-blue-100 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                      {cat.icon || "📚"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{cat.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {cat.courseCount} course{cat.courseCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 rounded-lg border border-blue-100 bg-white/80 text-blue-600 hover:bg-blue-50 transition"
                      aria-label="Edit category"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="p-2 rounded-lg border border-red-100 bg-white/80 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                      aria-label="Delete category"
                    >
                      {deletingId === cat.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}

                {deleteError?.id === cat.id && (
                  <p className="mt-3 text-[11px] text-red-600 bg-red-50/80 rounded-lg px-2.5 py-2 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    {deleteError.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl">

            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-50/80 border border-red-100 p-3 text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="📚"
                  maxLength={4}
                  className="w-20 text-center rounded-xl border border-blue-100/70 bg-white/70 p-3 text-xl shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      className="h-8 w-8 rounded-lg border border-blue-100 bg-white/70 hover:bg-blue-50 text-base transition flex items-center justify-center"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Web Development"
                  className="w-full rounded-xl border border-blue-100/70 bg-white/70 p-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Description <span className="text-slate-300 normal-case">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown to students browsing this category..."
                  className="w-full rounded-xl border border-blue-100/70 bg-white/70 p-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200/60 transition disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
