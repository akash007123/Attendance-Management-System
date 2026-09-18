import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../store/api/baseApi";
import { EmptyState } from "../../components/common/EmptyState";
import { formatDate } from "../../utils/date";
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { data: notifications = [], isLoading } = useGetNotificationsQuery(
    currentUser?.id ? currentUser.id : undefined
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const filteredNotifications = notifications.filter((n) =>
    filter === "ALL" ? true : !n.isRead
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "ATTENDANCE_PUNCH":
        return <CalendarCheck className="w-5 h-5 text-blue-500" />;
      case "VALIDATION_DECISION":
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case "OVERTIME_DECISION":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "GEOFENCE_ALERT":
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attendance verification updates, shift alerts, and overtime approvals
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead(currentUser?.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === "ALL"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === "UNREAD"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="No Notifications"
            description="You are caught up on all attendance alerts and reviews."
          />
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) markRead(notif.id);
                if (notif.link) navigate(notif.link);
              }}
              className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                !notif.isRead
                  ? "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDate(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
