import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setSidebarOpen } from "../../store/slices/uiSlice";
import { logout } from "../../store/slices/authSlice";
import { Badge } from "../common/Badge";
import {
  LayoutDashboard,
  CalendarCheck,
  Zap,
  FileSpreadsheet,
  Bell,
  User as UserIcon,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  X,
  Clock,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isOpen = useAppSelector((state) => state.ui.sidebarOpen);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      dispatch(setSidebarOpen(false));
    }
  };

  const role = currentUser?.role || "EMPLOYEE";

  // Role-based Nav Items
  const employeeNav = [
    { label: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
    { label: "My Attendance", path: "/employee/attendance", icon: CalendarCheck },
    { label: "Overtime", path: "/employee/overtime", icon: Zap },
    { label: "Daily Reports", path: "/reports/daily", icon: FileSpreadsheet },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "My Profile", path: "/profile", icon: UserIcon },
  ];

  const managerNav = [
    { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Team Attendance", path: "/manager/attendance", icon: CalendarCheck },
    { label: "Selfie Validation", path: "/manager/validation", icon: ShieldCheck },
    { label: "Overtime Requests", path: "/manager/overtime", icon: Zap },
    { label: "Team Reports", path: "/reports/daily", icon: FileSpreadsheet },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Profile", path: "/profile", icon: UserIcon },
  ];

  const adminNav = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", path: "/admin/users", icon: Users },
    { label: "All Attendance", path: "/admin/attendance", icon: CalendarCheck },
    { label: "Selfie Validation", path: "/admin/validation", icon: ShieldCheck },
    { label: "Overtime Approval", path: "/admin/overtime", icon: Zap },
    { label: "System Reports", path: "/reports/daily", icon: FileSpreadsheet },
    { label: "Settings", path: "/admin/settings", icon: Settings },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Admin Profile", path: "/profile", icon: UserIcon },
  ];

  const navLinks =
    role === "ADMIN" ? adminNav : role === "MANAGER" ? managerNav : employeeNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 block">
                AMS Enterprise
              </span>
              <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                Attendance System
              </span>
            </div>
          </div>

          <button
            onClick={closeMobileSidebar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Identity Card in Sidebar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <img
              src={
                currentUser?.avatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
              }
              alt={currentUser?.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                {currentUser?.name}
              </p>
              <div className="mt-0.5">
                <Badge type="role" status={role} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {role === "ADMIN" ? "Admin Portal" : role === "MANAGER" ? "Manager Portal" : "Employee Portal"}
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions: Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            id="sidebar-logout-button"
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
