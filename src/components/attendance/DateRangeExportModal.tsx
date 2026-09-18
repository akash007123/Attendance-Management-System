import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Attendance } from "../../types/attendance";
import { exportAttendanceRecordsToCSV } from "../../utils/export";
import { useAppDispatch } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import {
  CalendarRange,
  Download,
  X,
  FileSpreadsheet,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";

interface DateRangeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceList: Attendance[];
  initialStartDate?: string;
  initialEndDate?: string;
  initialDepartment?: string;
}

export const DateRangeExportModal: React.FC<DateRangeExportModalProps> = ({
  isOpen,
  onClose,
  attendanceList,
  initialStartDate = "",
  initialEndDate = "",
  initialDepartment = "ALL",
}) => {
  const dispatch = useAppDispatch();

  // Helper to format Date to YYYY-MM-DD
  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = useMemo(() => toISODate(new Date()), []);

  // Compute default range (e.g. 1st of current month to today, or 30 days)
  const defaultStart = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return toISODate(firstDay);
  }, []);

  const [startDate, setStartDate] = useState<string>(initialStartDate || defaultStart);
  const [endDate, setEndDate] = useState<string>(initialEndDate || today);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDepartment);
  const [activePreset, setActivePreset] = useState<string>("this_month");

  // Sync with props when opening
  useEffect(() => {
    if (isOpen) {
      if (initialStartDate) setStartDate(initialStartDate);
      else setStartDate(defaultStart);

      if (initialEndDate) setEndDate(initialEndDate);
      else setEndDate(today);

      if (initialDepartment) setSelectedDepartment(initialDepartment);
    }
  }, [isOpen, initialStartDate, initialEndDate, initialDepartment, defaultStart, today]);

  // Extract all unique departments from records
  const departments = useMemo(() => {
    const set = new Set<string>();
    attendanceList.forEach((r) => {
      if (r.employeeDepartment) set.add(r.employeeDepartment);
    });
    return Array.from(set).sort();
  }, [attendanceList]);

  // Filter records based on selected date range & department
  const filteredRecords = useMemo(() => {
    return attendanceList.filter((item) => {
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      if (selectedDepartment !== "ALL" && item.employeeDepartment !== selectedDepartment) {
        return false;
      }
      return true;
    });
  }, [attendanceList, startDate, endDate, selectedDepartment]);

  // Calculate summary metrics for the preview
  const summaryMetrics = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const employeeIds = new Set(filteredRecords.map((r) => r.employeeId));
    const totalMinutes = filteredRecords.reduce((acc, r) => acc + (r.totalWorkingMinutes || 0), 0);
    const completedCount = filteredRecords.filter((r) => r.status === "COMPLETED").length;
    const validCount = filteredRecords.filter((r) => r.validationStatus === "VALID").length;

    const totalHours = (totalMinutes / 60).toFixed(1);
    const completionRate = totalRecords > 0 ? Math.round((completedCount / totalRecords) * 100) : 0;
    const validationRate = totalRecords > 0 ? Math.round((validCount / totalRecords) * 100) : 0;

    return {
      totalRecords,
      uniqueEmployees: employeeIds.size,
      totalHours,
      completionRate,
      validationRate,
    };
  }, [filteredRecords]);

  // Quick Range Presets
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === "today") {
      const todayStr = toISODate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "last_7") {
      const past7 = new Date();
      past7.setDate(now.getDate() - 6);
      setStartDate(toISODate(past7));
      setEndDate(toISODate(now));
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toISODate(firstDay));
      setEndDate(toISODate(now));
    } else if (preset === "last_month") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toISODate(firstDayLastMonth));
      setEndDate(toISODate(lastDayLastMonth));
    } else if (preset === "last_30") {
      const past30 = new Date();
      past30.setDate(now.getDate() - 29);
      setStartDate(toISODate(past30));
      setEndDate(toISODate(now));
    } else if (preset === "all_time") {
      if (attendanceList.length > 0) {
        const sortedDates = [...attendanceList].map((r) => r.date).sort();
        setStartDate(sortedDates[0]);
        setEndDate(sortedDates[sortedDates.length - 1]);
      } else {
        setStartDate("");
        setEndDate("");
      }
    }
  };

  const isDateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  const handleDownload = () => {
    if (filteredRecords.length === 0) {
      dispatch(
        addToast({
          type: "warning",
          message: "No attendance records found within the chosen date range to export.",
        })
      );
      return;
    }

    const deptSlug = selectedDepartment === "ALL" ? "all-departments" : selectedDepartment.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const startSlug = startDate || "start";
    const endSlug = endDate || "end";
    const filename = `attendance-records_${startSlug}_to_${endSlug}_${deptSlug}.csv`;

    exportAttendanceRecordsToCSV(filteredRecords, filename);

    dispatch(
      addToast({
        type: "success",
        message: `Successfully generated and downloaded CSV with ${filteredRecords.length} attendance records (${startDate || "earliest"} to ${endDate || "latest"}).`,
      })
    );

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Export Attendance Records
                  </h2>
                  <p className="text-xs text-slate-500">
                    Generate and download CSV reports for selected date ranges
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Quick Range Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  Quick Presets
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { id: "this_month", label: "This Month" },
                    { id: "last_30", label: "Last 30D" },
                    { id: "last_7", label: "Last 7D" },
                    { id: "last_month", label: "Last Month" },
                    { id: "today", label: "Today" },
                    { id: "all_time", label: "All Time" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-center border ${
                        activePreset === p.id
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="export-start-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Start Date (From)
                  </label>
                  <input
                    id="export-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setActivePreset("custom");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="export-end-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    End Date (To)
                  </label>
                  <input
                    id="export-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setActivePreset("custom");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Validation error if start > end */}
              {isDateRangeInvalid && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>The start date must be earlier than or equal to the end date.</span>
                </div>
              )}

              {/* Department Filter */}
              <div>
                <label
                  htmlFor="export-department-filter"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Department Filter
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="export-department-filter"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Departments (Entire Organization)</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Preview Summary Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    CSV Export Preview
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      summaryMetrics.totalRecords > 0
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {summaryMetrics.totalRecords} Records Ready
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>Employees</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {summaryMetrics.uniqueEmployees}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Logged Time</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {summaryMetrics.totalHours} hrs
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
                      <span>Completion</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {summaryMetrics.completionRate}%
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60 pt-2.5">
                  <span>
                    Range:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {startDate || "Earliest"} → {endDate || "Latest"}
                    </strong>
                  </span>
                  <span>
                    Format: <strong className="text-slate-700 dark:text-slate-300">UTF-8 RFC4180 CSV</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                id="confirm-download-csv-btn"
                type="button"
                onClick={handleDownload}
                disabled={summaryMetrics.totalRecords === 0 || isDateRangeInvalid}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                Download CSV ({summaryMetrics.totalRecords})
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
