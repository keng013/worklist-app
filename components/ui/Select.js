import React from "react";

/**
 * Reusable Select Component
 * @param {object} props
 * @param {string} props.label - The label text for the select input.
 * @param {string} props.name - The name attribute for the select element.
 * @param {string[]} [props.options=[]] - An array of strings to populate the options.
 */
const Select = ({ label, name, options = [], ...props }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
    </label>
    <select
      id={name}
      name={name}
      {...props}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
    >
      {/* เพิ่มตัวเลือก "All" สำหรับการกรอง */}
      <option value="">All</option>

      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default Select;
