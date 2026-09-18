import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import {
  useGetAttendanceQuery,
  useGetUsersQuery,
  useGetOvertimeRequestsQuery,
  useGetSettingsQuery,
} from "../../store/api/baseApi";
import { AttendanceDetailsModal } from "../../components/attendance/AttendanceDetailsModal";
import { AttendanceValidationModal } from "../../components/validation/AttendanceValidationModal";
import { Badge } from "../../components/common/Badge";
import { Attendance } from "../../types/attendance";
import { formatDate, formatTime } from "../../utils/date";
import {
  Users,
  CalendarCheck,
  ShieldCheck,
  Zap,
  Settings,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  Building,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const AdminDashboard: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { data: users = [] } = useGetUsersQuery();
  const { data: attendanceList = [] } = useGetAttendanceQuery();
  const { data: overtimeRequests = [] } = useGetOvertimeRequestsQuery();
  const { data: settings } = useGetSettingsQuery();

  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [validatingRecord, setValidatingRecord] = useState<Attendance | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = attendanceList.filter((a) => a.date === todayStr);

  const totalEmployees = users.filter((u) => u.role === "EMPLOYEE" || u.role === "MANAGER").length;
  const presentToday = todayAttendance.length;
  const completedToday = todayAttendance.filter((a) => a.status === "COMPLETED").length;
  const incompleteToday = todayAttendance.filter((a) => a.status === "INCOMPLETE").length;

  const pendingValidations = attendanceList.filter((a) => a.validationStatus === "PENDING");
  const suspiciousRecords = attendanceList.filter(
    (a) => a.validationStatus === "SUSPICIOUS" || !a.punchInLocation.isWithinGeofence
  );
  const pendingOvertime = overtimeRequests.filter((o) => o.status === "PENDING");

  // Department Attendance Breakdown Data
  const departments = ["Engineering", "HR", "Finance", "Sales & Marketing", "Operations"];
  const departmentChartData = departments.map((dept) => {
    const deptPunches = todayAttendance.filter((a) => a.employeeDepartment === dept);
    const deptCompleted = deptPunches.filter((a) => a.status === "COMPLETED").length;
    const deptIncomplete = deptPunches.filter((a) => a.status === "INCOMPLETE").length;
    return {
      name: dept === "Sales & Marketing" ? "Sales" : dept,
      completed: deptCompleted,
      incomplete: deptIncomplete,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Enterprise Administration
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            System Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global attendance tracking, biometric selfie validations, geofence radius configuration, and user directory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/validation"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Validate Selfies ({pendingValidations.length})
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
            Office Geofence
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Workforce</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {totalEmployees}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active system users</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-600">Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {presentToday}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {completedToday} Completed (≥8h)
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-600">Pending Validation</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingValidations.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting biometric review</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-rose-600">Suspicious / Alert</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {suspiciousRecords.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Outside geofence or flagged</span>
        </div>
      </div>

      {/* Main Grid: Department Attendance Chart & Suspicious Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Attendance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Department Attendance Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Today's shift completion status across organizational units
              </p>
            </div>
            <span className="text-xs text-slate-500">Target: ≥8h completed</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="completed" name="Completed Shift (≥8h)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="incomplete" name="Incomplete (<8h)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Office Geofence Status Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Geofence & Office Anchor
              </h3>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                settings?.geofenceEnabled
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {settings?.geofenceEnabled ? "Enforced" : "Disabled"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Office Campus</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                  {settings?.officeName || "Tech Park Head Office"}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Coords: {settings?.officeLatitude}, {settings?.officeLongitude}
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                  Allowed Radius: {settings?.allowedRadiusMeters || 100} meters
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Shift Policy</span>
                <div className="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <p>Standard Shift: <strong>{settings?.standardShiftHours || 8} Hours</strong></p>
                  <p>Grace Period: <strong>{settings?.gracePeriodMinutes || 15} mins</strong></p>
                  <p>Overtime Min: <strong>{settings?.overtimeMinimumMinutes || 30} mins</strong></p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Link
              to="/admin/settings"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between"
            >
              <span>Edit policy settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Flagged & Suspicious Attendance Audit Feed */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Flagged Geofence & Biometric Verification Queue
            </h3>
            <p className="text-xs text-slate-500">
              Punches marked suspicious or taken outside the {settings?.allowedRadiusMeters || 100}m radius
            </p>
          </div>
          <Link
            to="/admin/validation"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Review All Validations ({pendingValidations.length})
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {attendanceList
            .filter((a) => !a.punchInLocation.isWithinGeofence || a.validationStatus === "SUSPICIOUS")
            .slice(0, 4)
            .map((record) => (
              <div
                key={record.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shrink-0">
                    <img
                      src={record.punchInSelfie}
                      alt={record.employeeName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {record.employeeName} ({record.employeeDepartment})
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Distance: <strong>{record.punchInLocation.distanceMeters}m from office</strong> • {formatTime(record.punchIn)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge type="validation" status={record.validationStatus} size="sm" />
                  <button
                    type="button"
                    onClick={() => setValidatingRecord(record)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(record)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
    </div>
  );
};
