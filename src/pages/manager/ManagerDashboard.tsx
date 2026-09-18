import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import {
  useGetAttendanceQuery,
  useGetOvertimeRequestsQuery,
  useGetUsersQuery,
  useGetSettingsQuery,
} from "../../store/api/baseApi";
import { AttendanceDetailsModal } from "../../components/attendance/AttendanceDetailsModal";
import { AttendanceValidationModal } from "../../components/validation/AttendanceValidationModal";
import { OvertimeReviewModal } from "../../components/overtime/OvertimeReviewModal";
import { MonthlyHoursLineChart } from "../../components/dashboard/MonthlyHoursLineChart";
import { Badge } from "../../components/common/Badge";
import { Attendance } from "../../types/attendance";
import { OvertimeRequest } from "../../types/overtime";
import { formatDate, formatTime, formatDurationHoursMinutes } from "../../utils/date";
import {
  Users,
  CalendarCheck,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  Check,
} from "lucide-react";

export const ManagerDashboard: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Manager oversees department / team
  const { data: allUsers = [] } = useGetUsersQuery();
  const users = currentUser?.role === "MANAGER"
    ? allUsers.filter((u) => u.department === currentUser.department)
    : allUsers;
  const { data: attendanceList = [] } = useGetAttendanceQuery();
  const { data: overtimeRequests = [] } = useGetOvertimeRequestsQuery();
  const { data: settings } = useGetSettingsQuery();

  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [validatingRecord, setValidatingRecord] = useState<Attendance | null>(null);
  const [reviewingOvertime, setReviewingOvertime] = useState<OvertimeRequest | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter attendance for today and manager's department
  const todayAttendance = attendanceList.filter((a) => {
    if (a.date !== todayStr) return false;
    if (currentUser?.role === "MANAGER") {
      return a.employeeDepartment === currentUser.department;
    }
    return true;
  });

  const presentCount = todayAttendance.length;
  const completedCount = todayAttendance.filter((a) => a.status === "COMPLETED").length;
  const incompleteCount = todayAttendance.filter((a) => a.status === "INCOMPLETE").length;

  const pendingValidations = attendanceList.filter((a) => a.validationStatus === "PENDING");
  const pendingOvertime = overtimeRequests.filter((o) => o.status === "PENDING");

  // Filter attendance for manager's department
  const departmentAttendance = attendanceList.filter((a) =>
    currentUser?.role === "MANAGER" ? a.employeeDepartment === currentUser.department : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Manager Control Dashboard
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            {currentUser?.department} Department
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring live employee biometric punches, geofence compliance, and overtime workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/manager/validation"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Validate Selfies ({pendingValidations.length})
          </Link>
          <Link
            to="/manager/overtime"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Overtime ({pendingOvertime.length})
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Present Today</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {presentCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Total logged today</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-600">Completed (≥8h)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {completedCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Met full shift</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-600">Pending Validation</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingValidations.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Selfies needing review</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-purple-600">Pending Overtime</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {pendingOvertime.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting manager decision</span>
        </div>
      </div>

      {/* Monthly Performance Analytics: Daily Total Hours Worked vs. Average Expected Hours */}
      <MonthlyHoursLineChart
        attendanceList={attendanceList}
        department={currentUser?.department || "Engineering"}
        users={allUsers}
        standardShiftHours={settings?.standardShiftHours || 8}
      />

      {/* Main Grid: Live Team Attendance & Pending Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Attendance Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Team Attendance Activity
              </h3>
              <p className="text-xs text-slate-500">Live biometric logs from team members</p>
            </div>
            <Link
              to="/manager/attendance"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {departmentAttendance.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black shrink-0 relative">
                    <img
                      src={record.punchInSelfie}
                      alt={record.employeeName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {record.employeeName}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {formatTime(record.punchIn)} • Duration:{" "}
                      <strong>{formatDurationHoursMinutes(record.totalWorkingMinutes)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge type="attendance" status={record.status} size="sm" />
                  <Badge type="validation" status={record.validationStatus} size="sm" />
                  <button
                    type="button"
                    onClick={() => setValidatingRecord(record)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    title="Validate Selfie"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(record)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Overtime Requests Quick Review */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Overtime Requests
                </h3>
                <p className="text-xs text-slate-500">Pending reviews</p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full">
                {pendingOvertime.length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingOvertime.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No overtime requests waiting for review
                </div>
              ) : (
                pendingOvertime.slice(0, 3).map((ot) => (
                  <div
                    key={ot.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900 dark:text-slate-100">{ot.employeeName}</span>
                      <span className="text-blue-600 dark:text-blue-400">{ot.requestedHours} hrs</span>
                    </div>
                    <p className="text-slate-500 line-clamp-2 text-[11px]">"{ot.reason}"</p>
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setReviewingOvertime(ot)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-lg transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Link
              to="/manager/overtime"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between"
            >
              <span>Manage all overtime applications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      <AttendanceValidationModal
        isOpen={!!validatingRecord}
        onClose={() => setValidatingRecord(null)}
        record={validatingRecord}
      />

      {/* Details Modal */}
      <AttendanceDetailsModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        canValidate={true}
        onOpenValidation={(rec) => setValidatingRecord(rec)}
      />

      {/* Overtime Review Modal */}
      <OvertimeReviewModal
        isOpen={!!reviewingOvertime}
        onClose={() => setReviewingOvertime(null)}
        request={reviewingOvertime}
      />
    </div>
  );
};
