"use client";

import { useState, useRef } from "react";
import { Upload, File, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  accept?: string;
  maxSizeMb?: number;
}

export default function FileUpload({
  onUploadComplete,
  folder = "courses",
  accept = "*",
  maxSizeMb = 100,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      startUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const startUpload = async (uploadFile: File) => {
    // Validate file size
    if (uploadFile.size > maxSizeMb * 1024 * 1024) {
      setStatus("error");
      setError(`File is too large. Maximum allowed size is ${maxSizeMb}MB.`);
      return;
    }

    setFile(uploadFile);
    setStatus("uploading");
    setProgress(0);
    setError("");

    try {
      // 1. Fetch SAS upload URL (or mock URL)
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          folder,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize upload");
      }

      const { uploadUrl, blobUrl } = data;

      // 2. Perform upload using XMLHttpRequest for progress updates
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      
      // Azure requires x-ms-blob-type: BlockBlob for block blob uploads
      if (!data.isMock) {
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
      }
      xhr.setRequestHeader("Content-Type", uploadFile.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          setProgress(percentage);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setStatus("success");
          onUploadComplete(blobUrl);
        } else {
          console.error("[UPLOAD_XHR_ERROR_STATUS]", xhr.status, xhr.statusText);
          setStatus("error");
          setError(`Upload failed. Server responded with status ${xhr.status}`);
        }
      };

      xhr.onerror = () => {
        setStatus("error");
        setError("Network error occurred during file upload.");
      };

      xhr.send(uploadFile);
    } catch (err: any) {
      console.error("[UPLOAD_FAILED]", err);
      setStatus("error");
      setError(err.message || "Failed to upload file.");
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={status === "idle" || status === "error" || status === "success" ? onButtonClick : undefined}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
          dragActive
            ? "border-blue-600 bg-blue-50/20 dark:border-blue-500 dark:bg-blue-950/20"
            : status === "uploading"
            ? "border-slate-200 bg-slate-50/25 dark:border-slate-800 dark:bg-slate-950/10 cursor-not-allowed"
            : "border-slate-200 hover:border-slate-350 bg-white dark:border-slate-800 dark:bg-slate-950"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={status === "uploading"}
          className="hidden"
        />

        {status === "idle" && (
          <>
            <div className="bg-slate-50 p-3 rounded-xl mb-3 dark:bg-slate-900">
              <Upload className="h-5 w-5 text-slate-450 dark:text-slate-500" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Drag and drop your file here, or <span className="text-blue-600 dark:text-blue-400">browse</span>
            </p>
            <p className="text-[10px] text-slate-450 mt-1 dark:text-slate-500">
              Acceptable file sizes: up to {maxSizeMb}MB
            </p>
          </>
        )}

        {status === "uploading" && (
          <div className="w-full space-y-3 max-w-xs">
            <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Uploading {file?.name}...
            </p>
            <div className="relative w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-850">
              <div
                className="bg-blue-600 h-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xxs font-bold text-slate-500 dark:text-slate-400">
              {progress}% Uploaded
            </span>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-2">
            <div className="bg-emerald-50 p-2.5 rounded-full inline-block dark:bg-emerald-950/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {file?.name} uploaded successfully!
            </p>
            <p className="text-xxs text-slate-450 dark:text-slate-500">
              Click area to replace file
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <div className="bg-red-50 p-2.5 rounded-full inline-block dark:bg-red-950/20">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs font-bold text-red-800 dark:text-red-400">{error}</p>
            <p className="text-xxs text-slate-450 dark:text-slate-500">
              Click area to retry upload
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
