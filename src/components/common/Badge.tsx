import React from "react";
import { Check, Clock, AlertTriangle, XCircle, ShieldCheck, HelpCircle } from "lucide-react";
import { AttendanceStatus, ValidationStatus, OvertimeStatus } from "../../types/attendance";
import { OvertimeRequestStatus } from "../../types/overtime";

interface BadgeProps {
  type: "attendance" | "validation" | "overtime" | "role" | "custom";
  status: AttendanceStatus | ValidationStatus | OvertimeStatus | OvertimeRequestStatus | string;
  className?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  type,
  status,
  className = "",
  size = "md",
}) => {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  if (type === "attendance") {
    switch (status) {
      case "CLOSED":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses} ${className}`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Closed
          </span>
        );
      case "COMPLETED":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses} ${className}`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Completed (≥8h)
          </span>
        );
      case "PRESENT":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 ${sizeClasses} ${className}`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            In Progress
          </span>
        );
      case "INCOMPLETE":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${sizeClasses} ${className}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Incomplete (&lt;8h)
          </span>
        );
      case "ABSENT":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ${sizeClasses} ${className}`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Absent
          </span>
        );
    }
  }

  if (type === "validation") {
    switch (status) {
      case "VALID":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses} ${className}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Valid
          </span>
        );
      case "SUSPICIOUS":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 ${sizeClasses} ${className}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Suspicious
          </span>
        );
      case "INVALID":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ${sizeClasses} ${className}`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Invalid / Fake
          </span>
        );
      case "PENDING":
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${sizeClasses} ${className}`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            Pending Verification
          </span>
        );
    }
  }

  if (type === "overtime") {
    switch (status) {
      case "APPROVED":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses} ${className}`}
          >
            <Check className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ${sizeClasses} ${className}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case "PENDING":
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${sizeClasses} ${className}`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case "NONE":
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs ${className}`}
          >
            None
          </span>
        );
    }
  }

  if (type === "role") {
    const roleColors: Record<string, string> = {
      ADMIN: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
      MANAGER: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
      EMPLOYEE: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    };
    return (
      <span
        className={`inline-flex items-center font-bold tracking-wide rounded-md border uppercase ${roleColors[status] || "bg-slate-100 text-slate-700"} ${sizeClasses} ${className}`}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${sizeClasses} ${className}`}
    >
      {status}
    </span>
  );
};
