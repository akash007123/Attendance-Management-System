import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { OvertimeRequest } from "../../types/overtime";
import { useApproveOvertimeMutation, useRejectOvertimeMutation } from "../../store/api/baseApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { formatDate } from "../../utils/date";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";

interface OvertimeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: OvertimeRequest | null;
}

export const OvertimeReviewModal: React.FC<OvertimeReviewModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [approveMutation, { isLoading: isApproving }] = useApproveOvertimeMutation();
  const [rejectMutation, { isLoading: isRejecting }] = useRejectOvertimeMutation();

  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isProcessing = isApproving || isRejecting;

  if (!request) return null;

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (action === "REJECT" && !remarks.trim()) {
      setErrorMsg("Rejection reason is required to notify the employee.");
      return;
    }

    try {
      setErrorMsg(null);
      if (action === "APPROVE") {
        await approveMutation({
          requestId: request.id,
          remarks: remarks.trim() || undefined,
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
        }).unwrap();

        dispatch(
          addToast({
            type: "success",
            message: `Overtime request of ${request.requestedHours}h for ${request.employeeName} approved.`,
          })
        );
      } else {
        await rejectMutation({
          requestId: request.id,
          remarks: remarks.trim(),
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
        }).unwrap();

        dispatch(
          addToast({
            type: "info",
            message: `Overtime request for ${request.employeeName} rejected with remarks.`,
          })
        );
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.data?.message || err.message || "Action failed.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Overtime Request"
      subtitle={`Submitted by ${request.employeeName} (${request.employeeDepartment})`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Request Details Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Date:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(request.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Requested Period:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {request.startTime} - {request.endTime} ({request.requestedHours} hours)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Reason:</span>
            <p className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
              "{request.reason}"
            </p>
          </div>
        </div>

        {/* Action Toggle (Approve / Reject) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Decision *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setAction("APPROVE");
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                action === "APPROVE"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Check className="w-4 h-4 text-emerald-600" />
              Approve Overtime
            </button>

            <button
              type="button"
              onClick={() => {
                setAction("REJECT");
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                action === "REJECT"
                  ? "bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ring-2 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <X className="w-4 h-4 text-rose-600" />
              Reject Request
            </button>
          </div>
        </div>

        {/* Remarks Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reviewer Remarks {action === "REJECT" && <span className="text-rose-500 font-bold">*</span>}
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={
              action === "APPROVE"
                ? "Optional approval remarks..."
                : "Required: Specify reasons for rejection..."
            }
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
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
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`inline-flex items-center gap-2 px-6 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-all ${
              action === "APPROVE"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            } disabled:opacity-50`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : action === "APPROVE" ? (
              <>
                <Check className="w-4 h-4" />
                Confirm Approval
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Confirm Rejection
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
