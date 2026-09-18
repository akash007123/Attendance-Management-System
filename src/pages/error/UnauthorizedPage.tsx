import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const getDashboardPath = () => {
    if (!currentUser) return "/login";
    switch (currentUser.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "MANAGER":
        return "/manager/dashboard";
      default:
        return "/employee/dashboard";
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
        <ShieldAlert className="w-9 h-9" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
        403 • Access Restricted
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 mb-2">
        You Don't Have Permission
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        Your account role (
        <strong className="text-slate-800 dark:text-slate-200">
          {currentUser?.role || "GUEST"}
        </strong>
        ) is not authorized to access this module. If you believe this is an error, please contact your administrator.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button
          onClick={() => navigate(getDashboardPath())}
          className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
        >
          <Home className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};
