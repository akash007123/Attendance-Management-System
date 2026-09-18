import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setCredentials, logout } from "../../store/slices/authSlice";
import { useLoginMutation } from "../../store/api/baseApi";
import { addToast } from "../../store/slices/uiSlice";
import { ShieldAlert, ArrowLeft, Home, Users, LogOut } from "lucide-react";

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [loginMutation, { isLoading }] = useLoginMutation();

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

  const handleQuickSwitch = async (email: string) => {
    try {
      const res = await loginMutation({ email, password: "password123" }).unwrap();
      dispatch(setCredentials(res));
      dispatch(
        addToast({
          type: "success",
          message: `Switched account to ${res.user.name} (${res.user.role})`,
        })
      );
      if (res.user.role === "ADMIN") navigate("/admin/dashboard");
      else if (res.user.role === "MANAGER") navigate("/manager/dashboard");
      else navigate("/employee/dashboard");
    } catch {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
        403 • Restricted Access
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
        You Don't Have Permission
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        Your current account role (
        <strong className="text-slate-800 dark:text-slate-200">
          {currentUser?.role || "GUEST"}
        </strong>
        ) is not authorized to access this module. You can switch to an authorized account or return to your dashboard.
      </p>

      {/* Quick Switch Helper for Assessment / Demo */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-md w-full">
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
          <Users className="w-4 h-4 text-blue-500" /> Switch To Authorized Role
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickSwitch("employee@example.com")}
            className="p-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Employee
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickSwitch("manager@example.com")}
            className="p-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Manager
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickSwitch("admin@example.com")}
            className="p-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Admin
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button
          onClick={() => navigate(getDashboardPath())}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" /> Return to Dashboard
        </button>
        <button
          onClick={() => {
            dispatch(logout());
            navigate("/login");
          }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};
