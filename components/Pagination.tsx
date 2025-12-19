// /components/Pagination.tsx

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 5,
  totalItems,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate display range
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="flex flex-col items-center justify-between mt-8 space-y-4">
      {totalItems !== undefined && (
        <p className="text-sm text-slate-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{' '}
          to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{' '}
          items
        </p>
      )}

      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center space-x-1">
          {/* First page link if not in visible range */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageClick(1)}
                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="px-2 py-2 text-slate-600">...</span>
              )}
            </>
          )}

          {/* Page numbers */}
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Last page link if not in visible range */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-2 py-2 text-slate-600">...</span>
              )}
              <button
                onClick={() => handlePageClick(totalPages)}
                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
