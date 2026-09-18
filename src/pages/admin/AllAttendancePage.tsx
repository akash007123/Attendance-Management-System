import React, { useState, useMemo } from "react";
import { useGetAttendanceQuery } from "../../store/api/baseApi";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { AttendanceDetailsModal } from "../../components/attendance/AttendanceDetailsModal";
import { AttendanceValidationModal } from "../../components/validation/AttendanceValidationModal";
import { DateRangeExportModal } from "../../components/attendance/DateRangeExportModal";
import { Badge } from "../../components/common/Badge";
import { Pagination } from "../../components/common/Pagination";
import { EmptyState } from "../../components/common/EmptyState";
import { Attendance } from "../../types/attendance";
import { formatDate, formatTime, formatDurationHoursMinutes } from "../../utils/date";
import { exportAttendanceRecordsToCSV, exportToPDF } from "../../utils/export";
import { addToast } from "../../store/slices/uiSlice";
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Eye,
  ShieldCheck,
  Building,
  Calendar,
  CalendarRange,
  RotateCcw,
} from "lucide-react";

export const AllAttendancePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: attendanceList = [], isLoading } = useGetAttendanceQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedValidation, setSelectedValidation] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [validatingRecord, setValidatingRecord] = useState<Attendance | null>(null);

  // Filter scoped to Manager department if Manager, otherwise all
  const filteredList = useMemo(() => {
    return attendanceList.filter((item) => {
      if (currentUser?.role === "MANAGER" && item.employeeDepartment !== currentUser.department) {
        return false;
      }
      if (selectedDepartment !== "ALL" && item.employeeDepartment !== selectedDepartment) {
        return false;
      }
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }
      if (selectedValidation !== "ALL" && item.validationStatus !== selectedValidation) {
        return false;
      }
      if (startDate && item.date < startDate) {
        return false;
      }
      if (endDate && item.date > endDate) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.employeeName.toLowerCase().includes(q);
        const matchesDept = item.employeeDepartment.toLowerCase().includes(q);
        const matchesDate = item.date.includes(q);
        if (!matchesName && !matchesDept && !matchesDate) return false;
      }
      return true;
    });
  }, [
    attendanceList,
    currentUser,
    selectedDepartment,
    selectedStatus,
    selectedValidation,
    startDate,
    endDate,
    searchQuery,
  ]);

  const totalRecords = filteredList.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const rangeSuffix =
      startDate && endDate
        ? `_${startDate}_to_${endDate}`
        : startDate
        ? `_from_${startDate}`
        : endDate
        ? `_until_${endDate}`
        : "";
    exportAttendanceRecordsToCSV(filteredList, `workforce-attendance${rangeSuffix}.csv`);
    dispatch(
      addToast({
        type: "success",
        message: `Exported ${filteredList.length} attendance records to CSV.`,
      })
    );
  };

  const handleExportPDF = () => {
    exportToPDF(filteredList, "Workforce Attendance Log", "workforce-attendance-report.pdf");
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      selectedDepartment !== "ALL" ||
      selectedStatus !== "ALL" ||
      selectedValidation !== "ALL" ||
      startDate ||
      endDate
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("ALL");
    setSelectedStatus("ALL");
    setSelectedValidation("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {currentUser?.role === "MANAGER" ? "Team Attendance Directory" : "Workforce Attendance Directory"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit live employee shifts, biometric timestamps, and geofence locations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Action: Export CSV by Date Range */}
          <button
            id="export-date-range-csv-btn"
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Export CSV for custom date range with summary preview"
          >
            <CalendarRange className="w-4 h-4" />
            Export CSV by Date Range
          </button>

          <button
            id="export-table-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
            title="Download CSV for current table view"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Current View
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

      {/* Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Search & Filter Directory</span>
            {(startDate || endDate) && (
              <span className="ml-2 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                Date Range Active
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter (if Admin) */}
          {currentUser?.role === "ADMIN" && (
            <div>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          )}

          {/* From Date Filter */}
          <div>
            <input
              id="filter-start-date"
              type="date"
              title="From Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To Date Filter */}
          <div>
            <input
              id="filter-end-date"
              type="date"
              title="To Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
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
              <option value="PENDING">Pending Review</option>
              <option value="VALID">Valid</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="INVALID">Invalid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {paginatedList.length === 0 ? (
          <EmptyState
            title="No Attendance Records Found"
            description="Adjust your search filters or date range selection."
            actionLabel="Clear Filters"
            onAction={handleClearFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Selfie</th>
                  <th className="px-4 py-3">Punch In</th>
                  <th className="px-4 py-3">Punch Out</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Validation</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {item.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.employeeDepartment}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
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
                      <span className="text-[10px] text-slate-400 block">
                        {item.totalWorkingMinutes >= 480 ? "≥8h standard" : "<8h standard"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge type="attendance" status={item.status} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge type="validation" status={item.validationStatus} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setValidatingRecord(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                        title="Validate Selfie"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

      {/* Date Range CSV Export Modal */}
      <DateRangeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        attendanceList={attendanceList}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialDepartment={selectedDepartment}
      />
    </div>
  );
};
