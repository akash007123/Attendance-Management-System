import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLoginMutation } from "../../store/api/baseApi";
import { useAppDispatch } from "../../store/hooks";
import { setCredentials } from "../../store/slices/authSlice";
import { addToast } from "../../store/slices/uiSlice";
import {
  Clock,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("employee@example.com");
  const [password, setPassword] = useState("Password@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const response = await loginMutation({ email, password, rememberMe }).unwrap();
      dispatch(setCredentials(response));
      dispatch(
        addToast({
          type: "success",
          message: `Welcome back, ${response.user.name}!`,
        })
      );

      // Route according to role
      const from = (location.state as any)?.from?.pathname;
      if (from && !from.includes("/login") && !from.includes("/403")) {
        navigate(from, { replace: true });
      } else {
        switch (response.user.role) {
          case "ADMIN":
            navigate("/admin/dashboard", { replace: true });
            break;
          case "MANAGER":
            navigate("/manager/dashboard", { replace: true });
            break;
          default:
            navigate("/employee/dashboard", { replace: true });
            break;
        }
      }
    } catch (err: any) {
      setErrorMessage(err.data?.message || err || "Invalid email or password.");
    }
  };

  // Quick fill helper for testing
  const selectDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password@123");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Attendance Management
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enterprise biometric & geolocation attendance system
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Demo Accounts Panel */}
        <div className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-500" />
              Demo Assessment Accounts
            </span>
            <span className="text-[10px] text-slate-400">Click to autofill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="demo-btn-employee"
              type="button"
              onClick={() => selectDemoAccount("employee@example.com")}
              className={`p-2 rounded-xl border text-left transition-all ${
                email === "employee@example.com"
                  ? "bg-blue-50 border-blue-500 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="block text-[11px] font-bold">Employee</span>
              <span className="block text-[10px] opacity-75 truncate">Aarav Sharma</span>
            </button>

            <button
              id="demo-btn-manager"
              type="button"
              onClick={() => selectDemoAccount("manager@example.com")}
              className={`p-2 rounded-xl border text-left transition-all ${
                email === "manager@example.com"
                  ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="block text-[11px] font-bold">Manager</span>
              <span className="block text-[10px] opacity-75 truncate">Priya Patel</span>
            </button>

            <button
              id="demo-btn-admin"
              type="button"
              onClick={() => selectDemoAccount("admin@example.com")}
              className={`p-2 rounded-xl border text-left transition-all ${
                email === "admin@example.com"
                  ? "bg-purple-50 border-purple-500 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="block text-[11px] font-bold">Admin</span>
              <span className="block text-[10px] opacity-75 truncate">Rajesh M.</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Workplace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Don't have an enterprise account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
