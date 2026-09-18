import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { Badge } from "../../components/common/Badge";
import { formatDate } from "../../utils/date";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  Calendar,
  Lock,
  Building,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      dispatch(addToast({ type: "error", message: "New passwords do not match." }));
      return;
    }
    dispatch(
      addToast({
        type: "success",
        message: "Password changed successfully.",
      })
    );
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img
            src={
              currentUser.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
            }
            alt={currentUser.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
          />

          <div className="text-center sm:text-left flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {currentUser.name}
              </h1>
              <Badge type="role" status={currentUser.role} size="sm" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser.designation} • {currentUser.department}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.phone || "+91 98765 43210"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Workplace & Shift Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Shift & Schedule Policy
            </h3>
          </div>

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Assigned Shift:</span>
              <span className="font-semibold">General Standard Day Shift</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Standard Duration:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">8 Hours 00 Mins</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Grace Period:</span>
              <span className="font-semibold">15 Minutes</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Completion Criteria:</span>
              <span className="font-semibold text-emerald-600">≥8h Completed, &lt;8h Incomplete</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Assigned Workplace & Security
            </h3>
          </div>

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Campus Facility:</span>
              <span className="font-semibold">Tech Park Corporate HQ</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Biometric Authenticity:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live Camera Active
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Geofence Compliance:</span>
              <span className="font-semibold text-emerald-600">Enforced (100m)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Account Status:</span>
              <span className="font-semibold text-emerald-600">Active Directory User</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Security & Credentials
          </h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};
