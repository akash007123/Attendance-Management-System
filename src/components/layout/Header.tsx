import React, { useState, useRef, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { toggleSidebar, toggleTheme } from "../../store/slices/uiSlice";
import { logout } from "../../store/slices/authSlice";
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation } from "../../store/api/baseApi";
import { Badge } from "../common/Badge";
import { formatDate } from "../../utils/date";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  CheckCheck,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Radio,
} from "lucide-react";

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const theme = useAppSelector((state) => state.ui.theme);

  const { data: notifications = [] } = useGetNotificationsQuery(
    currentUser?.id ? currentUser.id : undefined,
    { pollingInterval: 15000 } // Simulate live background updates
  );
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs and title from pathname
  const pathParts = location.pathname.split("/").filter(Boolean);
  const formatBreadcrumb = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");

  const pageTitle =
    pathParts.length > 0 ? formatBreadcrumb(pathParts[pathParts.length - 1]) : "Dashboard";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          id="header-mobile-menu-button"
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span>Home</span>
            {pathParts.map((part, index) => (
              <React.Fragment key={part}>
                <ChevronRight className="w-3 h-3" />
                <span className={index === pathParts.length - 1 ? "text-slate-600 dark:text-slate-300 font-semibold" : ""}>
                  {formatBreadcrumb(part)}
                </span>
              </React.Fragment>
            ))}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: Live Sync badge, Theme Toggle, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Subtle Live Sync Indicator */}
        <div
          title="Live mock synchronization active"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[11px] font-semibold"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Live Sync</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="theme-toggle-button"
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          title="Toggle Light / Dark Mode"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-bell-button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead(currentUser?.id)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications available
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (notif.link) navigate(notif.link);
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        !notif.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {notif.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="header-profile-menu-button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={
                currentUser?.avatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
              }
              alt={currentUser?.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {currentUser?.name}
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {currentUser?.role}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                <div className="mt-1.5">
                  <Badge type="role" status={currentUser?.role || "EMPLOYEE"} size="sm" />
                </div>
              </div>

              <div className="p-1 space-y-0.5 text-xs font-semibold">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <UserIcon className="w-4 h-4" /> My Profile
                </Link>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    dispatch(logout());
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
