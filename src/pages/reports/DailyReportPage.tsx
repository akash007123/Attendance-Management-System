import React, { useState, useMemo } from "react";
import { useGetAttendanceQuery, useGetUsersQuery } from "../../store/api/baseApi";
import { Badge } from "../../components/common/Badge";
import { Attendance } from "../../types/attendance";
import { formatDate, formatTime, formatDurationHoursMinutes } from "../../utils/date";
import { exportToCSV, exportToPDF } from "../../utils/export";
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export const DailyReportPage: React.FC = () => {
  const { data: attendanceList = [] } = useGetAttendanceQuery();
  const { data: users = [] } = useGetUsersQuery();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((a) => {
      if (selectedDate && a.date !== selectedDate) return false;
      if (selectedDept !== "ALL" && a.employeeDepartment !== selectedDept) return false;
      return true;
    });
  }, [attendanceList, selectedDate, selectedDept]);

  const presentCount = filteredAttendance.length;
  const completedCount = filteredAttendance.filter((a) => a.status === "COMPLETED").length;
  const incompleteCount = filteredAttendance.filter((a) => a.status === "INCOMPLETE").length;
  const lateCount = filteredAttendance.filter((a) => a.status === "LATE").length;
  const validCount = filteredAttendance.filter((a) => a.validationStatus === "VALID").length;
  const totalOvertime = filteredAttendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);

  const pieData = [
    { name: "Completed (≥8h)", value: completedCount, color: "#10b981" },
    { name: "Incomplete (<8h)", value: incompleteCount, color: "#f59e0b" },
    { name: "Late Arrival", value: lateCount, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const handleExportCSV = () => {
    exportToCSV(filteredAttendance, `attendance-report-${selectedDate}.csv`);
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredAttendance,
      `Daily Attendance Report - ${selectedDate}`,
      `attendance-report-${selectedDate}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Daily Shift Attendance Audit & Reporting
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift compliance analysis, 8-hour completion rates, biometric validations, and export tools
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Date & Department Filter Ribbon */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Present</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {presentCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Logged check-ins</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600 block">Completed (≥8h)</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {completedCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {presentCount > 0 ? Math.round((completedCount / presentCount) * 100) : 0}% compliance
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-600 block">Incomplete (&lt;8h)</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {incompleteCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Under 8 hour standard</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-blue-600 block">Overtime Total</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {totalOvertime}h
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Logged extra duration</span>
        </div>
      </div>

      {/* Breakdown Grid: Pie Chart & Detailed Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Shift Completion Ratio
            </h3>
            <p className="text-xs text-slate-500">Distribution for {selectedDate}</p>
          </div>

          <div className="h-56 w-full my-auto">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No shift data for selected date
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500">
            Standard: <strong>08:00 hrs shift</strong>. Minimum threshold required for Completed status.
          </div>
        </div>

        {/* Detailed Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Shift Log Entries ({filteredAttendance.length})
            </h3>
            <span className="text-xs text-slate-500">{selectedDate}</span>
          </div>

          {filteredAttendance.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No attendance logs found for this date.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Punch In</th>
                    <th className="px-4 py-3">Punch Out</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAttendance.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {item.employeeName}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {item.employeeDepartment}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                        {formatTime(item.punchIn)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                        {item.punchOut ? formatTime(item.punchOut) : "Active"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatDurationHoursMinutes(item.totalWorkingMinutes)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge type="attendance" status={item.status} size="sm" />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge type="validation" status={item.validationStatus} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
