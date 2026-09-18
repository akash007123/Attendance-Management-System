import React, { useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { useGetOvertimeRequestsQuery } from "../../store/api/baseApi";
import { OvertimeRequestModal } from "../../components/overtime/OvertimeRequestModal";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { formatDate } from "../../utils/date";
import { Zap, Plus, Clock, CheckCircle2, AlertCircle, Filter } from "lucide-react";

export const OvertimePage: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: requests = [] } = useGetOvertimeRequestsQuery(
    currentUser ? { employeeId: currentUser.id } : undefined
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filteredRequests = requests.filter((r) =>
    filterStatus === "ALL" ? true : r.status === filterStatus
  );

  // Stats
  const totalRequestedHours = requests.reduce((acc, curr) => acc + curr.requestedHours, 0);
  const approvedHours = requests
    .filter((r) => r.status === "APPROVED")
    .reduce((acc, curr) => acc + (curr.approvedHours || curr.requestedHours), 0);
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header & Apply Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Overtime Requests & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit extra working hours and monitor management review status
          </p>
        </div>

        <button
          id="btn-request-overtime"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Apply for Overtime
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Requested</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {totalRequestedHours} hrs
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across all submissions</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-600">Approved Hours</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {approvedHours} hrs
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Authorized for payroll</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-600">Pending Review</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting manager decision</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === status
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Request Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No Overtime Requests"
            description="You haven't submitted any overtime requests for this status."
            actionLabel="Apply for Overtime"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Timing</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reviewer Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatDate(req.date)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      {req.startTime} - {req.endTime}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                      {req.requestedHours} hrs
                    </td>

                    <td className="px-4 py-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate">
                      {req.reason}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge type="overtime" status={req.status} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 max-w-xs text-slate-500 text-[11px]">
                      {req.reviewerRemarks ? (
                        <span className="italic">"{req.reviewerRemarks}"</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <OvertimeRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
