import React from "react";

/**
 * Pagination Component (New Layout)
 * @param {object} props
 * ...
 */
const Pagination = ({ pagination, onNavigate, onLimitChange }) => {
  const {
    totalCount = 0,
    currentPage = 1,
    totalPages = 1,
    limit = 10,
  } = pagination;

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    onNavigate({ ...pagination, page: newPage });
  };

  // ถ้า totalCount = 0, totalPages ควรเป็น 0
  const safeTotalPages = totalPages > 0 ? totalPages : 0;
  const safeCurrentPage = totalCount === 0 ? 0 : currentPage;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white/70 dark:bg-gray-800/70 backdrop-blur-md px-4 py-3 sm:px-6 rounded-2xl shadow-lg mt-4">
      {" "}
      {/* Left Side: Rows per page & Total items */}
      <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 mb-2 md:mb-0">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={onLimitChange}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
        >
          {[10, 25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
        <span className="border-l border-gray-300 dark:border-gray-600 pl-4">
          Total: {totalCount} items
        </span>
      </div>
      {/* Right Side: Page navigation */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page {safeCurrentPage} of {safeTotalPages}
        </span>
        <nav
          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
          aria-label="Pagination"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;
