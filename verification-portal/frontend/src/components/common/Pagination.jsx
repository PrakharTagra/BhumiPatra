import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white text-xs text-slate-600 ${className}`}>
      <div className="text-slate-500">
        {totalItems !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-slate-800">{startItem}</strong> to{' '}
            <strong className="font-semibold text-slate-800">{endItem}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalItems}</strong> records
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-slate-800">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="First Page"
          className="p-1.5"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
          className="px-2"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
        </Button>

        <span className="px-3 py-1 font-medium bg-slate-100 rounded border border-slate-200 text-navy-900">
          {currentPage} / {totalPages || 1}
        </span>

        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
          className="px-2"
        >
          Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
          className="p-1.5"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
