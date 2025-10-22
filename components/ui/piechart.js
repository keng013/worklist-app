import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export const StoragePieChart = ({ percentage }) => {
  const data = [
    { name: "Used", value: percentage },
    { name: "Free", value: 100 - percentage },
  ];
  const COLORS = ["#3b82f6", "#374151"]; // Blue, Dark Gray
  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={450}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-800 dark:text-white">
          {percentage.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default StoragePieChart;
