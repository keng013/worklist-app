import React from "react";

/**
 * Reusable Input Component
 * @param {object} props
 * @param {string} props.label - The label text for the input.
 * @param {string} props.name - The name and id attribute for the input element.
 */
const Input = ({ label, name, ...props }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
    </label>
    <input
      id={name}
      name={name}
      {...props}
      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    />
  </div>
);

export default Input;
