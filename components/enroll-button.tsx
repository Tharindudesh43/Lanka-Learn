"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, PlayCircle, Loader2 } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  price: number;
  isEnrolled: boolean;
  isAuthenticated: boolean;
}

export default function EnrollButton({
  courseId,
  price,
  isEnrolled,
  isAuthenticated,
}: EnrollButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?callbackUrl=/courses/${courseId}`);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process enrollment");
      }

      if (data.direct) {
        // Direct free enrollment succeeded, route to classroom
        router.push(`/courses/${courseId}/learn`);
        router.refresh();
      } else if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <button
        onClick={() => router.push(`/courses/${courseId}/learn`)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
      >
        <PlayCircle className="h-5 w-5 fill-white/10" />
        Go to Classroom
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={handleEnroll}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-75 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            {price === 0 ? "Enroll for Free" : `$${price.toFixed(2)}`}
          </>
        )}
      </button>
      {error && (
        <p className="mt-2.5 text-xs text-center font-semibold text-red-500 bg-red-50 p-2.5 rounded-lg dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
