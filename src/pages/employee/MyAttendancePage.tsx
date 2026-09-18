import React, { useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { useGetAttendanceQuery } from "../../store/api/baseApi";
import { addToast } from "../../store/slices/uiSlice";
import { AttendanceDetailsModal } from "../../components/attendance/AttendanceDetailsModal";
import { Badge } from "../../components/common/Badge";
import { Pagination } from "../../components/common/Pagination";
import { EmptyState } from "../../components/common/EmptyState";
import { Attendance, AttendanceStatus, ValidationStatus } from "../../types/attendance";
import {
  formatDate,
  formatTime,
  formatDurationHoursMinutes,
  formatDurationPretty,
} from "../../utils/date";
import { exportToCSV, exportToPDF, generateMonthlyAttendancePDF } from "../../utils/export";
import {
  Calendar,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export const MyAttendancePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: attendanceList = [], isLoading } = useGetAttendanceQuery(
    currentUser ? { employeeId: currentUser.id } : undefined
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedValidation, setSelectedValidation] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Filter logic
  const filteredList = useMemo(() => {
    return attendanceList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = item.date.includes(q);
        const matchesAddress = item.punchInLocation.address?.toLowerCase().includes(q);
        if (!matchesDate && !matchesAddress) return false;
      }
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }
      if (selectedValidation !== "ALL" && item.validationStatus !== selectedValidation) {
        return false;
      }
      if (selectedMonth && !item.date.startsWith(selectedMonth)) {
        return false;
      }
      return true;
    });
  }, [attendanceList, searchQuery, selectedStatus, selectedValidation, selectedMonth]);

  // Statistics
  const totalRecords = filteredList.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const completedCount = filteredList.filter((a) => a.status === "COMPLETED").length;
  const incompleteCount = filteredList.filter((a) => a.status === "INCOMPLETE").length;
  const totalOvertimeHours = filteredList.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
  const validCount = filteredList.filter((a) => a.validationStatus === "VALID").length;

  const handleDownloadReport = () => {
    if (!currentUser) return;
    setIsGeneratingReport(true);
    try {
      // Determine targeted month (from filter, first recorded item, or current date)
      let targetMonth = selectedMonth;
      if (!targetMonth) {
        if (filteredList.length > 0) {
          targetMonth = filteredList[0].date.substring(0, 7);
        } else if (attendanceList.length > 0) {
          targetMonth = attendanceList[0].date.substring(0, 7);
        } else {
          const now = new Date();
          targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        }
      }

      // Filter attendance records specifically for the target month
      const monthlyRecords = attendanceList.filter((rec) => rec.date.startsWith(targetMonth));
      const recordsToExport = monthlyRecords.length > 0 ? monthlyRecords : filteredList;

      if (recordsToExport.length === 0) {
        dispatch(
          addToast({
            type: "warning",
            message: `No attendance records found for ${targetMonth} to generate report.`,
          })
        );
        setIsGeneratingReport(false);
        return;
      }

      generateMonthlyAttendancePDF({
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          department: currentUser.department,
          designation: currentUser.designation,
        },
        monthYear: targetMonth,
        records: recordsToExport,
      });

      dispatch(
        addToast({
          type: "success",
          message: `Monthly attendance report for ${targetMonth} generated and downloaded.`,
        })
      );
    } catch (error) {
      console.error("Failed to generate monthly attendance PDF:", error);
      dispatch(
        addToast({
          type: "error",
          message: "Failed to generate attendance report. Please try again.",
        })
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredList, `attendance-${currentUser?.name || "employee"}.csv`);
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredList,
      `Attendance Log - ${currentUser?.name || "Employee"}`,
      `attendance-${currentUser?.name || "employee"}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            My Attendance Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of shift check-ins, biometric selfies, and geofence validations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="download-report-btn"
            type="button"
            onClick={handleDownloadReport}
            disabled={isGeneratingReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Generate and download printable monthly attendance PDF report"
          >
            <Download className="w-4 h-4" />
            {isGeneratingReport ? "Generating..." : "Download Report"}
          </button>
          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            id="export-pdf-btn"
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            Quick Print
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Logs</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {totalRecords}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Filtered records</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600 block">Completed (≥8h)</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
            {completedCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Met shift duration</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-600 block">Incomplete (&lt;8h)</span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
            {incompleteCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Under required hours</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-blue-600 block">Approved Overtime</span>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1 block">
            {totalOvertimeHours}h
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Logged extra time</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search date (YYYY-MM-DD)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Month Filter */}
          <div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed (≥8h)</option>
              <option value="INCOMPLETE">Incomplete (&lt;8h)</option>
              <option value="PRESENT">Present (Active)</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>

          {/* Validation Filter */}
          <div>
            <select
              value={selectedValidation}
              onChange={(e) => {
                setSelectedValidation(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Validations</option>
              <option value="VALID">Valid</option>
              <option value="PENDING">Pending Verification</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="INVALID">Invalid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Record List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {paginatedList.length === 0 ? (
          <EmptyState
            title="No Attendance Records Found"
            description="Try clearing your search query or selecting a different month filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery("");
              setSelectedStatus("ALL");
              setSelectedValidation("ALL");
              setSelectedMonth("");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Selfie</th>
                  <th className="px-4 py-3">Punch In</th>
                  <th className="px-4 py-3">Punch Out</th>
                  <th className="px-4 py-3">Duration (HH:mm)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Validation</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                        <img
                          src={item.punchInSelfie}
                          alt="Selfie"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      {formatTime(item.punchIn)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      {item.punchOut ? formatTime(item.punchOut) : <span className="text-blue-500 font-medium">In progress</span>}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatDurationHoursMinutes(item.totalWorkingMinutes)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {item.totalWorkingMinutes >= 480 ? "≥ 8h Standard" : "< 8h Standard"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge type="attendance" status={item.status} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge type="validation" status={item.validationStatus} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredList.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              totalItems={totalRecords}
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AttendanceDetailsModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  );
};
