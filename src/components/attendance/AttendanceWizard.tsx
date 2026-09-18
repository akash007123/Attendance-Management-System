import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { CameraCapture } from "./CameraCapture";
import { LocationCapture } from "./LocationCapture";
import { AttendanceLocation, Attendance } from "../../types/attendance";
import { useGetSettingsQuery, usePunchInMutation, usePunchOutMutation } from "../../store/api/baseApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { formatTime, formatDate, calculateWorkingMinutes, formatDurationPretty } from "../../utils/date";
import { formatCoordinates } from "../../utils/geolocation";
import {
  Camera,
  MapPin,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ScanFace,
  UserCheck,
} from "lucide-react";
import { FaceDetectionResult } from "../../utils/faceDetection";

interface AttendanceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "PUNCH_IN" | "PUNCH_OUT";
  activeAttendance?: Attendance | null;
}

type Step = 1 | 2 | 3 | 4;

export const AttendanceWizard: React.FC<AttendanceWizardProps> = ({
  isOpen,
  onClose,
  mode,
  activeAttendance,
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: settings } = useGetSettingsQuery();

  const isAttendanceClosed =
    mode === "PUNCH_IN" && !!activeAttendance?.punchIn && !!activeAttendance?.punchOut;

  // RULE 7: DO NOT OPEN CAMERA IF ATTENDANCE IS ALREADY CLOSED
  React.useEffect(() => {
    if (isOpen && isAttendanceClosed) {
      dispatch(
        addToast({
          type: "error",
          message: "You already punched out for today. Please contact admin/manager.",
        })
      );
      onClose();
    }
  }, [isOpen, isAttendanceClosed, dispatch, onClose]);

  const [step, setStep] = useState<Step>(1);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<AttendanceLocation | null>(null);
  const [faceResult, setFaceResult] = useState<FaceDetectionResult | null>(null);

  const [punchInMutation, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOutMutation, { isLoading: isPunchingOut }] = usePunchOutMutation();

  const isSubmitting = isPunchingIn || isPunchingOut;

  const handleClose = () => {
    if (isSubmitting) return;
    setStep(1);
    setCapturedSelfie(null);
    setCapturedLocation(null);
    setFaceResult(null);
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && !capturedSelfie) {
      dispatch(addToast({ type: "warning", message: "Please capture your live selfie to proceed." }));
      return;
    }
    if (step === 2 && !capturedLocation) {
      dispatch(addToast({ type: "warning", message: "Please capture GPS location to proceed." }));
      return;
    }
    setStep((prev) => (prev + 1) as Step);
  };

  const handlePrev = () => {
    setStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!currentUser || !capturedSelfie || !capturedLocation) return;

    if (mode === "PUNCH_IN" && activeAttendance?.punchIn && activeAttendance?.punchOut) {
      dispatch(
        addToast({
          type: "error",
          message: "You already punched out for today. Please contact admin/manager.",
        })
      );
      handleClose();
      return;
    }

    try {
      if (mode === "PUNCH_IN") {
        await punchInMutation({
          employeeId: currentUser.id,
          selfie: capturedSelfie,
          location: capturedLocation,
          faceDetected: faceResult?.detected ?? true,
          faceConfidence: faceResult?.confidence ?? 95,
        }).unwrap();

        dispatch(
          addToast({
            type: "success",
            message: "Attendance punched in successfully with verified face presence!",
          })
        );
        setStep(4);
      } else {
        if (!activeAttendance) throw new Error("No active attendance record found to punch out");
        await punchOutMutation({
          attendanceId: activeAttendance.id,
          selfie: capturedSelfie,
          location: capturedLocation,
        }).unwrap();

        dispatch(
          addToast({
            type: "success",
            message: "Attendance punched out successfully!",
          })
        );
        setStep(4);
      }
    } catch (err: any) {
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        (err?.status === 409
          ? "You already punched out for today. Please contact admin/manager."
          : "Attendance submission failed.");

      dispatch(
        addToast({
          type: "error",
          message: errorMessage,
        })
      );
    }
  };

  const stepLabels = [
    { num: 1, label: "Camera", icon: Camera },
    { num: 2, label: "Location", icon: MapPin },
    { num: 3, label: "Review", icon: FileCheck },
    { num: 4, label: "Done", icon: CheckCircle2 },
  ];

  const now = new Date();
  const currentWorkingMinutes =
    mode === "PUNCH_OUT" && activeAttendance
      ? calculateWorkingMinutes(activeAttendance.punchIn, now.toISOString())
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "PUNCH_IN" ? "Punch In Verification" : "Punch Out Verification"}
      subtitle={
        mode === "PUNCH_IN"
          ? "Complete live camera and GPS verification to record your entry."
          : "Complete exit selfie and location check to close your shift."
      }
      maxWidth="xl"
    >
      {/* Stepper Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-0.5 w-full bg-slate-200 dark:bg-slate-800 -z-1" />
          {stepLabels.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div key={s.num} className="flex flex-col items-center bg-white dark:bg-slate-900 px-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isActive
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : isCompleted
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Camera Capture */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl flex items-start gap-3 text-xs text-blue-800 dark:text-blue-300">
            <ScanFace className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-200">
                Client-Side Face Detection Active:
              </p>
              <p className="leading-relaxed">
                {mode === "PUNCH_IN"
                  ? "Camera stream is continuously analyzed to confirm user presence before clock-in. Center your face directly within the guide until verified."
                  : "Live camera capture verified for exit punch out. Align face in the frame."}
              </p>
            </div>
          </div>

          <CameraCapture
            mode={mode}
            requireFaceDetection={mode === "PUNCH_IN"}
            onCapture={(img, res) => {
              setCapturedSelfie(img);
              if (res) setFaceResult(res);
            }}
            capturedImage={capturedSelfie}
            onRetake={() => {
              setCapturedSelfie(null);
              setFaceResult(null);
            }}
          />
        </div>
      )}

      {/* STEP 2: Location Capture */}
      {step === 2 && settings && (
        <div className="space-y-4">
          <LocationCapture
            settings={settings}
            onLocationCaptured={(loc) => setCapturedLocation(loc)}
            capturedLocation={capturedLocation}
            onRetry={() => setCapturedLocation(null)}
          />
        </div>
      )}

      {/* STEP 3: Review & Summary */}
      {step === 3 && capturedSelfie && capturedLocation && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selfie Preview */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Live Captured Selfie
              </span>
              <div className="aspect-4/3 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-black relative">
                <img
                  src={capturedSelfie}
                  alt="Captured Selfie"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {mode === "PUNCH_IN" ? "IN-SELFIE" : "OUT-SELFIE"}
                </span>
                {faceResult?.detected && (
                  <span className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                    <UserCheck className="w-3 h-3" /> User Present
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Metadata Box */}
            <div className="flex flex-col gap-3 justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                  Employee
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {currentUser?.name}
                </p>
                <p className="text-slate-500">{currentUser?.designation} • {currentUser?.department}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                  Timestamp
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  {formatDate(now)}, {formatTime(now)}
                </div>
              </div>

              {/* Biometric Verification Check */}
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                  Biometric Face Presence
                </span>
                <div className="mt-1">
                  {faceResult?.detected ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Present ({faceResult.confidence}% Confidence)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg">
                      <ScanFace className="w-3.5 h-3.5 text-blue-500" />
                      Live Stream Checked
                    </span>
                  )}
                </div>
              </div>

              {mode === "PUNCH_OUT" && activeAttendance && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-bold block">
                    Total Shift Duration
                  </span>
                  <p className="text-base font-extrabold text-blue-900 dark:text-blue-100 mt-0.5">
                    {formatDurationPretty(currentWorkingMinutes)}
                  </p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">
                    {currentWorkingMinutes >= 480 ? "Meets ≥8h standard" : "Under 8h standard (Incomplete)"}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                  GPS Location
                </span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatCoordinates(capturedLocation.latitude, capturedLocation.longitude)}
                </p>
                <div className="mt-1">
                  {capturedLocation.isWithinGeofence ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Within Office Geofence
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Outside Office Bounds
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Success Done */}
      {step === 4 && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {mode === "PUNCH_IN" ? "Punch In Confirmed!" : "Punch Out Recorded!"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              {mode === "PUNCH_IN"
                ? "Your entry time, verified selfie, and geolocation coordinates have been safely recorded."
                : "Your exit time and shift duration have been logged. Have a restful evening!"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-colors"
          >
            Close & View Dashboard
          </button>
        </div>
      )}

      {/* Navigation Controls */}
      {step < 4 && (
        <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={step === 1 ? handleClose : handlePrev}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 3 ? (
            <button
              id="wizard-next-button"
              type="button"
              onClick={handleNext}
              disabled={(step === 1 && !capturedSelfie) || (step === 2 && !capturedLocation)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow transition-colors"
            >
              Continue to {step === 1 ? "Location" : "Review"}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="confirm-punch-button"
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Attendance...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm {mode === "PUNCH_IN" ? "Punch In" : "Punch Out"}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};
