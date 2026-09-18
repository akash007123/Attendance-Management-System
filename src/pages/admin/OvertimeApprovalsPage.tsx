import React, { useState, useMemo } from "react";
import { useGetOvertimeRequestsQuery } from "../../store/api/baseApi";
import { useAppSelector } from "../../store/hooks";
import { OvertimeReviewModal } from "../../components/overtime/OvertimeReviewModal";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { OvertimeRequest } from "../../types/overtime";
import { formatDate } from "../../utils/date";
import { Zap, Clock, CheckCircle2, AlertCircle, Filter, Search } from "lucide-react";

export const OvertimeApprovalsPage: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: requests = [], isLoading } = useGetOvertimeRequestsQuery();

  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewingRequest, setReviewingRequest] = useState<OvertimeRequest | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Manager role scoping
      if (currentUser?.role === "MANAGER" && req.employeeDepartment !== currentUser.department) {
        return false;
      }
      if (selectedDept !== "ALL" && req.employeeDepartment !== selectedDept) {
        return false;
      }
      if (activeTab !== "ALL" && req.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = req.employeeName.toLowerCase().includes(q);
        const matchesReason = req.reason.toLowerCase().includes(q);
        if (!matchesName && !matchesReason) return false;
      }
      return true;
    });
  }, [requests, currentUser, activeTab, selectedDept, searchQuery]);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Overtime Authorization Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, authorize, or reject employee overtime hours with mandatory audit remarks
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-600 block">Pending Review</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting manager decision</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600 block">Authorized / Approved</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {approvedCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Sent to payroll</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-rose-600 block">Rejected Submissions</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {rejectedCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Denied with audit remarks</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab === "PENDING"
              ? `Pending (${pendingCount})`
              : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}

        {currentUser?.role === "ADMIN" && (
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="ml-auto px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Operations">Operations</option>
          </select>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No Overtime Requests"
            description="No requests match the selected status or department filter."
            actionLabel="View Pending"
            onAction={() => setActiveTab("PENDING")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Requested Hours</th>
                  <th className="px-4 py-3">Reason / Justification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Decision / Remarks</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {req.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400">{req.employeeDepartment}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(req.date)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      {req.startTime} - {req.endTime}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                      {req.requestedHours} hrs
                    </td>

                    <td className="px-4 py-3.5 max-w-xs text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-2">"{req.reason}"</p>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge type="overtime" status={req.status} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 max-w-xs text-slate-500 text-[11px]">
                      {req.reviewerRemarks ? (
                        <span>
                          <strong>{req.reviewedBy}:</strong> "{req.reviewerRemarks}"
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No remarks recorded</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setReviewingRequest(req)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        {req.status === "PENDING" ? "Review" : "Update"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <OvertimeReviewModal
        isOpen={!!reviewingRequest}
        onClose={() => setReviewingRequest(null)}
        request={reviewingRequest}
      />
    </div>
  );
};
