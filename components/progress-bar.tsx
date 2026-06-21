interface ProgressBarProps {
  progress: number;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ProgressBar({
  progress,
  showText = false,
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, progress));

  const heightClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 ${heightClass} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showText && (
          <span className="text-xs font-bold text-slate-700 min-w-[32px] text-right dark:text-slate-300">
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}
