import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Badge } from "../common/Badge";
import { Attendance, ValidationStatus } from "../../types/attendance";
import { useValidateAttendanceMutation } from "../../store/api/baseApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { formatTime, formatDate } from "../../utils/date";
import { formatCoordinates } from "../../utils/geolocation";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  User as UserIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface AttendanceValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Attendance | null;
}

export const AttendanceValidationModal: React.FC<AttendanceValidationModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [validateMutation, { isLoading }] = useValidateAttendanceMutation();

  const [selectedStatus, setSelectedStatus] = useState<ValidationStatus>("VALID");
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!record) return null;

  const handleConfirmValidation = async () => {
    if ((selectedStatus === "INVALID" || selectedStatus === "SUSPICIOUS") && !remarks.trim()) {
      setErrorMsg("Remarks are mandatory when marking attendance as Invalid or Suspicious.");
      return;
    }

    try {
      setErrorMsg(null);
      await validateMutation({
        attendanceId: record.id,
        validationStatus: selectedStatus,
        remarks: remarks.trim() || undefined,
        validatedBy: currentUser?.name || "System Admin",
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          message: `Attendance marked as ${selectedStatus} successfully.`,
        })
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.data?.message || err.message || "Validation failed.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify & Validate Live Selfie Attendance"
      subtitle={`Review biometric photo & GPS accuracy for ${record.employeeName}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Main Grid: Selfie & Location Verification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Large Selfie Viewport */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800 dark:text-slate-200">Live Camera Capture</span>
              <span className="font-mono text-slate-500">{formatTime(record.punchIn)}</span>
            </div>
            <div className="aspect-4/3 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-950 relative shadow-md">
              <img
                src={record.punchInSelfie}
                alt="Employee Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                LIVE CAMERA STAMP
              </div>
            </div>
          </div>

          {/* Context & Metadata Info */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Employee Details
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                  {record.employeeName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {record.employeeName}
                  </h4>
                  <p className="text-slate-500">{record.employeeDepartment}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-700/60 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date & Punch In:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(record.date)} • {formatTime(record.punchIn)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Punch Out:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {record.punchOut ? formatTime(record.punchOut) : "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Status:</span>
                <Badge type="attendance" status={record.status} size="sm" />
              </div>
            </div>

            {/* GPS Metadata Box */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  GPS Coordinates
                </span>
                <span className="text-[11px] text-slate-500">
                  Accuracy: ±{record.punchInLocation.accuracy}m
                </span>
              </div>
              <p className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                {formatCoordinates(record.punchInLocation.latitude, record.punchInLocation.longitude)}
              </p>
              <div className="mt-1">
                {record.punchInLocation.isWithinGeofence ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Inside Office Geofence ({record.punchInLocation.distanceMeters ?? 0}m)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" /> Outside Office Bounds ({record.punchInLocation.distanceMeters}m away)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Decision Section */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Validation Decision
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("VALID");
                  setErrorMsg(null);
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  selectedStatus === "VALID"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">VALID</span>
                <span className="text-[10px] opacity-75">Verified live person</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("SUSPICIOUS");
                  setErrorMsg(null);
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  selectedStatus === "SUSPICIOUS"
                    ? "bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">SUSPICIOUS</span>
                <span className="text-[10px] opacity-75">Location/photo flag</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("INVALID");
                  setErrorMsg(null);
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  selectedStatus === "INVALID"
                    ? "bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ring-2 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                }`}
              >
                <XCircle className="w-5 h-5 text-rose-600" />
                <span className="text-xs font-bold">INVALID / FAKE</span>
                <span className="text-[10px] opacity-75">Proxy or screen photo</span>
              </button>
            </div>
          </div>

          {/* Remarks Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reviewer Remarks{" "}
              {selectedStatus !== "VALID" && <span className="text-rose-500 font-bold">* (Required)</span>}
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={
                selectedStatus === "VALID"
                  ? "Optional verification notes (e.g. 'Photo verified, clean GPS')..."
                  : "State reason for suspicious or invalid marking (e.g. 'Photo appears to be taken off a phone screen or outside geofence without prior leave approval')..."
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-validation-btn"
            type="button"
            onClick={handleConfirmValidation}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Decision...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm Validation
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
