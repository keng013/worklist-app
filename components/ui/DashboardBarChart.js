import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/**
 * Reusable Bar Chart for Dashboard
 * @param {object} props
 * @param {string} props.title - Chart title
 * @param {Array<object>} props.data - Data array
 * @param {string} props.dataKey - Key to plot on the Y-axis (e.g., "studyCount")
 * @param {React.ReactNode} props.icon - Icon component
 */
const DashboardBarChart = ({ title, data, dataKey, icon }) => {
  // Find the key for X-axis (the one that is NOT dataKey)
  const xAxisKey =
    data.length > 0 ? Object.keys(data[0]).find((k) => k !== dataKey) : "name";

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/30 p-6 rounded-2xl shadow-lg h-80">
      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-4">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 0, right: 10, left: -20, bottom: 40 }} // Adjust bottom margin for angled labels
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey={xAxisKey}
            strokeOpacity={0.7}
            tick={{ fontSize: 12 }}
            angle={-45} // 👈 Angled labels
            textAnchor="end" // 👈 Align angled labels
            interval={0} // 👈 Show all labels
          />
          <YAxis strokeOpacity={0.7} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(5px)",
              borderRadius: "0.5rem",
              border: "1px solid rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardBarChart;
