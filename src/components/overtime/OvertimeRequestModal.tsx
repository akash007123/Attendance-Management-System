import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useCreateOvertimeRequestMutation, useGetAttendanceQuery } from "../../store/api/baseApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { formatDate } from "../../utils/date";
import { Zap, Clock, AlertTriangle, Loader2 } from "lucide-react";

interface OvertimeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OvertimeRequestModal: React.FC<OvertimeRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { data: myAttendance } = useGetAttendanceQuery(
    currentUser ? { employeeId: currentUser.id } : undefined
  );

  const [createOvertimeMutation, { isLoading }] = useCreateOvertimeRequestMutation();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [requestedHours, setRequestedHours] = useState(2);
  const [reason, setReason] = useState("");
  const [attendanceId, setAttendanceId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!reason.trim()) {
      setErrorMsg("Please provide a justifiable reason for your overtime request.");
      return;
    }
    if (requestedHours <= 0) {
      setErrorMsg("Requested overtime hours must be greater than zero.");
      return;
    }

    try {
      setErrorMsg(null);
      await createOvertimeMutation({
        employeeId: currentUser.id,
        date,
        startTime,
        endTime,
        requestedHours,
        reason: reason.trim(),
        attendanceId: attendanceId || undefined,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          message: "Overtime request submitted for manager review.",
        })
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.data?.message || err.message || "Failed to submit overtime request.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Overtime Approval"
      subtitle="Submit extra hours for manager and admin review"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Linked Attendance Record Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Link to Attendance Day
          </label>
          <select
            value={attendanceId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setAttendanceId(selectedId);
              const found = myAttendance?.find((a) => a.id === selectedId);
              if (found) {
                setDate(found.date);
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- General / Today's Date ({date}) --</option>
            {myAttendance?.map((att) => (
              <option key={att.id} value={att.id}>
                {formatDate(att.date)} (Shift: {Math.floor(att.totalWorkingMinutes / 60)}h {att.totalWorkingMinutes % 60}m)
              </option>
            ))}
          </select>
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Overtime Date *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Start & End Time Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time *
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Requested Hours */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Requested Overtime Hours (hrs) *
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="12"
            required
            value={requestedHours}
            onChange={(e) => setRequestedHours(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Reason / Business Justification */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason / Project Justification *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Explain the necessity for working overtime (e.g. Critical production release, server patch, urgent client deliverable)..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Submit Overtime Request
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
