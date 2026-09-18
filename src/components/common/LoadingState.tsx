import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  rows?: number;
  type?: "spinner" | "table-skeleton" | "cards-skeleton";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading data...",
  rows = 4,
  type = "spinner",
}) => {
  if (type === "table-skeleton") {
    return (
      <div className="w-full space-y-3 p-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded w-1/4" />
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded w-1/4" />
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded w-1/4" />
            <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "cards-skeleton") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded w-1/3" />
            <div className="h-7 bg-slate-200 dark:bg-slate-700/60 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {message}
      </span>
    </div>
  );
};
