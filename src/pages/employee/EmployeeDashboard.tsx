import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { useGetAttendanceQuery, useGetSettingsQuery } from "../../store/api/baseApi";
import { AttendanceWizard } from "../../components/attendance/AttendanceWizard";
import { AttendanceDetailsModal } from "../../components/attendance/AttendanceDetailsModal";
import { Badge } from "../../components/common/Badge";
import { Attendance } from "../../types/attendance";
import { addToast } from "../../store/slices/uiSlice";
import {
  formatDate,
  formatTime,
  getTimeBasedGreeting,
  calculateWorkingMinutes,
  formatDurationPretty,
  formatDurationHoursMinutes,
  getAttendanceDateString,
} from "../../utils/date";
import {
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock,
  ArrowRight,
  TrendingUp,
  LogIn,
  LogOut,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

export const EmployeeDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: settings } = useGetSettingsQuery();
  const { data: attendanceList = [], isLoading } = useGetAttendanceQuery(
    currentUser ? { employeeId: currentUser.id } : undefined
  );

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"PUNCH_IN" | "PUNCH_OUT">("PUNCH_IN");
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Use normalized attendance date (Asia/Kolkata business day)
  const todayStr = getAttendanceDateString(currentTime);

  // Find today's attendance record for current user
  const todayAttendance = attendanceList.find(
    (a) => a.date === todayStr && a.employeeId === currentUser?.id
  );

  // ATTENDANCE STATES:
  // STATE 1: No record exists for today -> Allow Punch In
  // STATE 2: Punched In, not Punched Out -> Punch In disabled, Punch Out enabled
  // STATE 3: Punched In AND Punched Out -> Attendance completed, Punch In strictly disabled
  const hasPunchedInToday = !!todayAttendance?.punchIn;
  const hasPunchedOutToday = !!todayAttendance?.punchOut;
  const isAttendanceCompletedToday = hasPunchedInToday && hasPunchedOutToday;
  const isCurrentlyPunchedIn = hasPunchedInToday && !hasPunchedOutToday;

  // Live working minutes calculation
  const currentWorkingMinutes = todayAttendance
    ? calculateWorkingMinutes(todayAttendance.punchIn, todayAttendance.punchOut, currentTime)
    : 0;

  const standardHours = settings?.standardShiftHours || 8;
  const standardMinutes = standardHours * 60;
  const progressPercent = Math.min(100, Math.round((currentWorkingMinutes / standardMinutes) * 100));

  const handlePunchAction = () => {
    // ENFORCE RULE 7: DO NOT OPEN CAMERA IF ATTENDANCE IS ALREADY CLOSED
    if (isAttendanceCompletedToday) {
      dispatch(
        addToast({
          type: "error",
          message: "You already punched out for today. Please contact admin/manager.",
        })
      );
      return;
    }

    if (isCurrentlyPunchedIn) {
      setWizardMode("PUNCH_OUT");
    } else {
      setWizardMode("PUNCH_IN");
    }
    setWizardOpen(true);
  };

  // Weekly Working Hours Chart Data
  const recent7Days = [...attendanceList]
    .slice(0, 7)
    .reverse()
    .map((record) => ({
      date: formatDate(record.date).split(" ")[0] + " " + formatDate(record.date).split(" ")[1],
      hours: Number((record.totalWorkingMinutes / 60).toFixed(1)),
      standard: standardHours,
      status: record.status,
    }));

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {getTimeBasedGreeting()},
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.designation} • {currentUser?.department}
          </p>
        </div>

        {/* Live Digital Clock & Date */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <div className="text-right">
            <div className="text-lg font-black font-mono tracking-wider text-slate-900 dark:text-slate-100">
              {currentTime.toLocaleTimeString("en-IN", { hour12: true })}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              {currentTime.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Attendance Card (Hero Section) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Shift Details & Progress */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Today's Shift: Standard 8-Hour Shift
              </span>
              {isAttendanceCompletedToday ? (
                <Badge type="attendance" status="CLOSED" />
              ) : todayAttendance ? (
                <Badge type="attendance" status={todayAttendance.status} />
              ) : (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Not Punched In Yet
                </span>
              )}
            </div>

            {/* Shift Progress Bar */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {formatDurationPretty(currentWorkingMinutes)}
                  <span className="text-xs font-normal text-slate-400 ml-2">
                    / {standardHours}h 00m Standard Shift
                  </span>
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {progressPercent}% Completed
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent >= 100
                      ? "bg-emerald-500"
                      : isCurrentlyPunchedIn
                      ? "bg-blue-600"
                      : "bg-slate-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                {isAttendanceCompletedToday
                  ? "✓ Today's shift is complete. Attendance closed for today."
                  : progressPercent >= 100
                  ? "✓ Shift target achieved (Completed ≥8h). Punch out when you conclude for the day."
                  : isCurrentlyPunchedIn
                  ? `Shift in progress. ${formatDurationPretty(Math.max(0, standardMinutes - currentWorkingMinutes))} remaining to meet standard 8-hour requirement.`
                  : "Begin your shift by capturing a live camera selfie and GPS verification."}
              </p>
            </div>

            {/* Today's In / Out Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Punch In
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  {hasPunchedInToday && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  {todayAttendance?.punchIn ? formatTime(todayAttendance.punchIn) : "--:--"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Punch Out
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  {hasPunchedOutToday && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  {todayAttendance?.punchOut ? formatTime(todayAttendance.punchOut) : "--:--"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Working Hours
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {todayAttendance ? formatDurationPretty(todayAttendance.totalWorkingMinutes || currentWorkingMinutes) : "--"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Status
                </span>
                <div className="mt-0.5">
                  {isAttendanceCompletedToday ? (
                    <Badge type="attendance" status="CLOSED" size="sm" />
                  ) : todayAttendance ? (
                    <Badge type="attendance" status={todayAttendance.status} size="sm" />
                  ) : (
                    <span className="text-xs text-slate-400">N/A</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Punch Action Button */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 min-w-[260px]">
            {isAttendanceCompletedToday ? (
              <div className="w-full flex flex-col items-center text-center">
                <button
                  id="btn-punch-in-disabled"
                  type="button"
                  disabled
                  className="w-full py-3 px-6 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black text-sm rounded-xl cursor-not-allowed border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 select-none"
                  title="You already punched out for today. Please contact admin/manager."
                >
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  PUNCH IN (DISABLED)
                </button>
                <div
                  id="attendance-closed-banner"
                  className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 w-full text-left"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-snug">
                        You already punched out for today.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-snug">
                        Please contact admin/manager.
                      </p>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                  Shift finalized for today
                </span>
              </div>
            ) : isCurrentlyPunchedIn ? (
              <>
                <button
                  id="btn-punch-out"
                  type="button"
                  onClick={handlePunchAction}
                  className="w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 flex items-center justify-center gap-2.5"
                >
                  <LogOut className="w-5 h-5" />
                  PUNCH OUT
                </button>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Requires live camera selfie & GPS
                </span>
              </>
            ) : (
              <>
                <button
                  id="btn-punch-in"
                  type="button"
                  onClick={handlePunchAction}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2.5"
                >
                  <LogIn className="w-5 h-5" />
                  PUNCH IN
                </button>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Requires live camera selfie & GPS
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analytics & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Working Hours Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Working Hours Trend
              </h3>
              <p className="text-xs text-slate-500">
                Logged daily shift hours against the 8.0h threshold
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
              Target: 8h/day
            </span>
          </div>

          <div className="h-64 w-full">
            {recent7Days.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No shift history available for chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recent7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} hrs`, "Working Hours"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine y={8} stroke="#10b981" strokeDasharray="4 4" label={{ value: "8h Standard", fill: "#10b981", fontSize: 10, position: "top" }} />
                  <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Recent Records List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Recent Attendance
            </h3>
            <p className="text-xs text-slate-500 mb-4">Past shifts logged</p>

            <div className="space-y-3">
              {attendanceList.slice(0, 4).map((record) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      <img
                        src={record.punchInSelfie}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {formatDate(record.date)}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {formatTime(record.punchIn)} - {record.punchOut ? formatTime(record.punchOut) : "In progress"}
                      </span>
                    </div>
                  </div>
                  <Badge type="attendance" status={record.status} size="sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <a
              href="/employee/attendance"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between"
            >
              <span>View complete attendance history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Attendance Modal / Wizard */}
      <AttendanceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        mode={wizardMode}
        activeAttendance={todayAttendance}
      />

      {/* Attendance Details Drawer / Modal */}
      <AttendanceDetailsModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  );
};
