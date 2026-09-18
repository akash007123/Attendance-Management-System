import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalRecords?: number;
  totalItems?: number;
  totalPages?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalRecords,
  totalItems,
  totalPages: propTotalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) => {
  const records = totalRecords ?? totalItems ?? 0;
  const totalPages = propTotalPages ?? Math.max(1, Math.ceil(records / pageSize));
  const startItem = records === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(records, currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
      {/* Records info */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-slate-900 dark:text-slate-100">{startItem}</strong> to{" "}
          <strong className="text-slate-900 dark:text-slate-100">{endItem}</strong> of{" "}
          <strong className="text-slate-900 dark:text-slate-100">{totalRecords}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs">Per page:</span>
            <select
              id="pagination-pagesize-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          id="pagination-first-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="First Page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          id="pagination-prev-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Previous Page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-semibold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-md">
          {currentPage} / {totalPages}
        </span>

        <button
          id="pagination-next-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Next Page"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          id="pagination-last-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Last Page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
