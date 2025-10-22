import React from "react";

/**
 * Status Badge Component
 * @param {object} props
 * @param {string} props.status - The status text (e.g., "SCHEDULED", "COMPLETED").
 */
const StatusBadge = ({ status }) => {
  // สร้าง object เพื่อ map status กับสีของ Tailwind
  const statusColors = {
    SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "IN PROGRESS":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    COMPLETED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    DEFAULT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };

  // เลือกสีโดยใช้ status ที่รับมา หรือใช้ DEFAULT ถ้าไม่ตรง
  const color = statusColors[status] || statusColors.DEFAULT;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status || "UNKNOWN"}
    </span>
  );
};

export default StatusBadge;
