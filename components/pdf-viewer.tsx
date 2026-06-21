"use client";

import { useState } from "react";
import { FileText, Download, CheckCircle, Loader2 } from "lucide-react";

interface PdfViewerProps {
  url: string;
  lessonId: string;
  isCompleted?: boolean;
  onComplete?: () => void;
}

export default function PdfViewer({
  url,
  lessonId,
  isCompleted = false,
  onComplete,
}: PdfViewerProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [completedState, setCompletedState] = useState(isCompleted);

  const handleMarkComplete = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          completed: true,
        }),
      });

      if (res.ok) {
        setCompletedState(true);
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-850 dark:bg-slate-900">
      {/* Control bar */}
      <div className="flex items-center justify-between bg-slate-50 px-5 py-3 border-b border-slate-100 dark:bg-slate-950/20 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-red-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Reading Assignment (PDF)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Download Button */}
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>

          {/* Mark Complete */}
          <button
            onClick={handleMarkComplete}
            disabled={completedState || isSyncing}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-sm ${
              completedState
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-75 cursor-pointer"
            }`}
          >
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            {completedState ? "Completed" : "Mark as Complete"}
          </button>
        </div>
      </div>

      {/* Frame body */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-950">
        <iframe
          src={`${url}#toolbar=0`}
          className="h-full w-full border-none"
          title="PDF Document Viewer"
        />
      </div>
    </div>
  );
}
