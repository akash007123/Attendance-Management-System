import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { removeToast } from "../../store/slices/uiSlice";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      const timer = setTimeout(() => {
        dispatch(removeToast(latest.id));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4"
    >
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
        };

        const borders = {
          success: "border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900",
          error: "border-rose-200 dark:border-rose-800/60 bg-white dark:bg-slate-900",
          warning: "border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900",
          info: "border-sky-200 dark:border-sky-800/60 bg-white dark:bg-slate-900",
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm text-slate-800 dark:text-slate-100 transition-all transform duration-200 animate-in fade-in slide-in-from-bottom-2 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 font-medium leading-relaxed">{toast.message}</div>
            <button
              id={`dismiss-toast-${toast.id}`}
              onClick={() => dispatch(removeToast(toast.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
