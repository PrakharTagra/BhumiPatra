import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from './Button';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  className = '',
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 bg-white text-xs text-slate-600 ${className}`}>
      {/* Items range display */}
      <div className="flex items-center gap-2">
        <span>
          Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalItems}</span> documents
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600"
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Page navigation controls */}
      <div className="flex items-center space-x-1">
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="sr-only sm:not-sr-only sm:inline-block ml-1">Previous</span>
        </Button>

        <span className="px-3 py-1 font-medium text-slate-700 bg-slate-100 rounded text-xs select-none">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <span className="sr-only sm:not-sr-only sm:inline-block mr-1">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
