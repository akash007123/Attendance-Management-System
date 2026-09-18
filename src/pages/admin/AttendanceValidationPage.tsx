import React, { useState, useMemo } from "react";
import { useGetAttendanceQuery, useValidateAttendanceMutation } from "../../store/api/baseApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { AttendanceValidationModal } from "../../components/validation/AttendanceValidationModal";
import { AttendanceDetailsModal } from "../../components/attendance/AttendanceDetailsModal";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { Attendance, ValidationStatus } from "../../types/attendance";
import { formatDate, formatTime } from "../../utils/date";
import { formatCoordinates } from "../../utils/geolocation";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  MapPin,
  Clock,
  CheckCheck,
} from "lucide-react";

export const AttendanceValidationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // If Manager, filter by their department; if Admin, show all
  const { data: attendanceList = [], isLoading } = useGetAttendanceQuery();
  const [validateMutation] = useValidateAttendanceMutation();

  const [activeFilter, setActiveFilter] = useState<ValidationStatus | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [validatingRecord, setValidatingRecord] = useState<Attendance | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter based on user role and tab filter
  const filteredList = useMemo(() => {
    return attendanceList.filter((record) => {
      // Role scoping
      if (currentUser?.role === "MANAGER") {
        if (record.employeeDepartment !== currentUser.department) return false;
      }

      // Tab filter
      if (activeFilter !== "ALL" && record.validationStatus !== activeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = record.employeeName.toLowerCase().includes(q);
        const matchesDept = record.employeeDepartment.toLowerCase().includes(q);
        const matchesDate = record.date.includes(q);
        if (!matchesName && !matchesDept && !matchesDate) return false;
      }

      return true;
    });
  }, [attendanceList, currentUser, activeFilter, searchQuery]);

  const pendingCount = attendanceList.filter((a) => a.validationStatus === "PENDING").length;
  const suspiciousCount = attendanceList.filter((a) => a.validationStatus === "SUSPICIOUS").length;
  const validCount = attendanceList.filter((a) => a.validationStatus === "VALID").length;
  const invalidCount = attendanceList.filter((a) => a.validationStatus === "INVALID").length;

  const handleBulkValidate = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await validateMutation({
          attendanceId: id,
          validationStatus: "VALID",
          remarks: "Bulk approved by reviewer",
          validatedBy: currentUser?.name || "Reviewer",
        }).unwrap();
      }
      dispatch(
        addToast({
          type: "success",
          message: `Successfully validated ${selectedIds.length} attendance records as Valid.`,
        })
      );
      setSelectedIds([]);
    } catch (err: any) {
      dispatch(addToast({ type: "error", message: "Failed to validate selected records." }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Bulk Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Biometric Selfie & Location Validation Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit employee camera capture authenticity, verify presence, and flag suspicious or proxy punches
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkValidate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark Selected ({selectedIds.length}) as Valid
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveFilter("PENDING")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeFilter === "PENDING"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>Pending Review</span>
          <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter("SUSPICIOUS")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeFilter === "SUSPICIOUS"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>Suspicious</span>
          <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">
            {suspiciousCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter("INVALID")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeFilter === "INVALID"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>Invalid / Fake</span>
          <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">
            {invalidCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter("VALID")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeFilter === "VALID"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>Verified Valid</span>
          <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">
            {validCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeFilter === "ALL"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          All Records
        </button>

        {/* Search Input */}
        <div className="ml-auto relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Validation Records Grid (Cards with large selfie viewport) */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <EmptyState
            title="No Records in this Filter"
            description="All attendance logs have been processed or no matching records match your query."
            actionLabel="View Pending Review"
            onAction={() => setActiveFilter("PENDING")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((record) => {
            const isSelected = selectedIds.includes(record.id);

            return (
              <div
                key={record.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, record.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== record.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {record.employeeName}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">
                          {record.employeeDepartment}
                        </span>
                      </div>
                    </div>
                    <Badge type="validation" status={record.validationStatus} size="sm" />
                  </div>

                  {/* Large Selfie Viewport */}
                  <div className="relative aspect-4/3 bg-slate-950 overflow-hidden">
                    <img
                      src={record.punchInSelfie}
                      alt={record.employeeName}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow">
                      IN: {formatTime(record.punchIn)}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2">
                      <div
                        className={`p-1.5 rounded-lg backdrop-blur-md text-[10px] font-semibold flex items-center justify-between ${
                          record.punchInLocation.isWithinGeofence
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                            : "bg-amber-950/80 text-amber-300 border border-amber-700/50"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {record.punchInLocation.isWithinGeofence ? "In Geofence" : "Outside Geofence"}
                        </span>
                        <span>{record.punchInLocation.distanceMeters ?? 0}m away</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="p-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Shift Date:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(record.date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>GPS Accuracy:</span>
                      <span className="font-mono">±{record.punchInLocation.accuracy}m</span>
                    </div>

                    {record.validationRemarks && (
                      <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 italic border border-slate-200/60 dark:border-slate-700/60">
                        "{record.validationRemarks}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(record)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    title="View Log Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setValidatingRecord(record)}
                    className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors text-center"
                  >
                    Verify & Decision
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification & Decision Modal */}
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
