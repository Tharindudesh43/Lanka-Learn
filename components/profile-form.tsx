"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, FileText, Sparkles, Loader2 } from "lucide-react";

interface ProfileFormProps {
  initialData: {
    name: string | null;
    headline: string | null;
    bio: string | null;
    image: string | null;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const { update } = useSession();
  const [name, setName] = useState(initialData.name || "");
  const [headline, setHeadline] = useState(initialData.headline || "");
  const [bio, setBio] = useState(initialData.bio || "");
  const [image, setImage] = useState(initialData.image || "");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, headline, bio, image }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setMessage("Your profile has been updated successfully!");
      
      // Sync NextAuth session state
      await update({
        name,
        image,
      });

    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {message && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Name Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Display Name
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-150 outline-none transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          />
          <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-450 dark:text-slate-500" />
        </div>
      </div>

      {/* Headline Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Professional Headline
        </label>
        <div className="relative">
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Web Developer | Student at University"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-150 outline-none transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          />
          <Sparkles className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-450 dark:text-slate-500" />
        </div>
      </div>

      {/* Profile Image URL */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Avatar Image URL
        </label>
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-150 outline-none transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        />
      </div>

      {/* Biography Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Biography
        </label>
        <textarea
          rows={5}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell other students and instructors about yourself, your background, and your learning goals..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-150 outline-none transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 leading-relaxed"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-75 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Profile Settings"
        )}
      </button>
    </form>
  );
}
