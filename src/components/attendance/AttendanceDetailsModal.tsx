import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Badge } from "../common/Badge";
import { Attendance } from "../../types/attendance";
import { formatDate, formatTime, formatDurationHoursMinutes, formatDurationPretty } from "../../utils/date";
import { formatCoordinates } from "../../utils/geolocation";
import {
  Clock,
  MapPin,
  Camera,
  ShieldCheck,
  Zap,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

interface AttendanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Attendance | null;
  onOpenValidation?: (record: Attendance) => void;
  canValidate?: boolean;
}

export const AttendanceDetailsModal: React.FC<AttendanceDetailsModalProps> = ({
  isOpen,
  onClose,
  record,
  onOpenValidation,
  canValidate = false,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "selfies" | "location" | "validation" | "overtime">("overview");

  if (!record) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "selfies", label: "Selfies", icon: Camera },
    { id: "location", label: "Location & GPS", icon: MapPin },
    { id: "validation", label: "Validation", icon: ShieldCheck },
    { id: "overtime", label: "Overtime", icon: Zap },
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Record Details"
      subtitle={`Log ID: ${record.id} • ${formatDate(record.date)}`}
      maxWidth="3xl"
    >
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Employee Header Card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-3">
              <img
                src={record.employeeAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                alt={record.employeeName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
              />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {record.employeeName}
                </h4>
                <p className="text-xs text-slate-500">{record.employeeDepartment}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge type="attendance" status={record.status} />
              <Badge type="validation" status={record.validationStatus} size="sm" />
            </div>
          </div>

          {/* Time & Duration Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">
                Punch In Time
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                {formatTime(record.punchIn)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {formatDate(record.punchIn)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">
                Punch Out Time
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                {record.punchOut ? formatTime(record.punchOut) : "Still Active"}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {record.punchOut ? formatDate(record.punchOut) : "Shift in progress"}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">
                Working Duration
              </span>
              <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {formatDurationPretty(record.totalWorkingMinutes)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Format: {formatDurationHoursMinutes(record.totalWorkingMinutes)} (Target: 08:00)
              </span>
            </div>
          </div>

          {/* Quick Summary Preview */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0">
                <img
                  src={record.punchInSelfie}
                  alt="Punch in selfie thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Location: {record.punchInLocation.address || "Office Campus"}
                </p>
                <p className="text-slate-500">
                  {formatCoordinates(record.punchInLocation.latitude, record.punchInLocation.longitude)} (±{record.punchInLocation.accuracy}m)
                </p>
              </div>
            </div>

            {canValidate && onOpenValidation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenValidation(record);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                Verify & Validate Selfie
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SELFIES */}
      {activeTab === "selfies" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Punch In Selfie */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Punch In Selfie
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {formatTime(record.punchIn)}
                </span>
              </div>
              <div className="aspect-4/3 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-950 relative shadow-sm">
                <img
                  src={record.punchInSelfie}
                  alt="Punch In Selfie"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  PUNCH IN
                </div>
                {record.faceDetected !== undefined && (
                  <div
                    className={`absolute top-2 right-2 text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow ${
                      record.faceDetected ? "bg-emerald-600/90" : "bg-amber-600/90"
                    }`}
                  >
                    {record.faceDetected
                      ? `✓ Face Verified (${record.faceConfidence || 95}%)`
                      : "Unverified Face"}
                  </div>
                )}
              </div>
            </div>

            {/* Punch Out Selfie */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Punch Out Selfie
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {record.punchOut ? formatTime(record.punchOut) : "Pending"}
                </span>
              </div>
              <div className="aspect-4/3 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-950 relative shadow-sm flex items-center justify-center">
                {record.punchOutSelfie ? (
                  <>
                    <img
                      src={record.punchOutSelfie}
                      alt="Punch Out Selfie"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      PUNCH OUT
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-medium">No Punch Out Selfie Recorded</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOCATION & GPS */}
      {activeTab === "location" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-500" />
              Punch-In Coordinates & Geofence
            </h5>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[11px]">Latitude</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {record.punchInLocation.latitude}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[11px]">Longitude</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {record.punchInLocation.longitude}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2">
              <span>GPS Accuracy: ±{record.punchInLocation.accuracy}m</span>
              <span>Address: {record.punchInLocation.address || "Detected Office Location"}</span>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center gap-3 text-xs font-medium ${
                record.punchInLocation.isWithinGeofence
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              }`}
            >
              {record.punchInLocation.isWithinGeofence ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Within designated office geofence radius ({record.punchInLocation.distanceMeters ?? 0}m from center).</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Detected {record.punchInLocation.distanceMeters}m outside designated office boundaries.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VALIDATION */}
      {activeTab === "validation" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Verification Status
              </span>
              <Badge type="validation" status={record.validationStatus} />
            </div>

            {record.validatedBy && (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Validated by: <strong className="text-slate-800 dark:text-slate-200">{record.validatedBy}</strong>{" "}
                on {formatDate(record.validatedAt)}
              </div>
            )}

            {record.validationRemarks ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                  Manager / Admin Remarks:
                </span>
                "{record.validationRemarks}"
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No custom validation remarks recorded yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: OVERTIME */}
      {activeTab === "overtime" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Overtime Status
              </span>
              <Badge type="overtime" status={record.overtimeStatus} />
            </div>

            {record.overtimeHours ? (
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p>
                  Requested Extra Hours: <strong>{record.overtimeHours} hours</strong>
                </p>
                {record.overtimeReason && (
                  <p className="text-slate-500">Reason: "{record.overtimeReason}"</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No overtime associated with this attendance record.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
