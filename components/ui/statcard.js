import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export const StatCard = ({ title, value, change, icon }) => {
  const isPositive = change >= 0;
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
          {value}
        </p>
        <div
          className={`flex items-center mt-2 text-sm font-semibold ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <ArrowUp size={16} className="mr-1" />
          ) : (
            <ArrowDown size={16} className="mr-1" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
