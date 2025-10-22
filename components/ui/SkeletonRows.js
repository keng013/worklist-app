import React from "react";

/**
 * Skeleton Loading Rows Component
 * @param {object} props
 * @param {number} [props.rows=5] - The number of skeleton rows to display.
 * @param {number} [props.cols=10] - The number of columns to match the table.
 */
const SkeletonRows = ({ rows = 5, cols = 10 }) => {
  return Array.from({ length: rows }).map((_, index) => (
    <tr key={index} className="animate-pulse">
      {/* สร้าง td ตามจำนวน cols */}
      {Array.from({ length: cols }).map((_, colIndex) => (
        <td key={colIndex} className="px-6 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  ));
};

export default SkeletonRows;
