import React, { useState, useEffect } from "react";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { apiClient } from "../lib/apiConfig";
import DashboardBarChart from "../components/ui/DashboardBarChart";
import {
  Database,
  Image,
  HardDrive,
  BarChart3,
  Clock,
  ClipboardList, // 👈 [ใหม่]
  RefreshCw, // 👈 [ใหม่]
  CheckCircle, // 👈 [ใหม่]
} from "lucide-react";

// (API ของคุณส่ง YYYYMMDD และ HHMMSS)
const formatDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return "";
  return `${dateStr.substring(6, 8)}/${dateStr.substring(
    4,
    6
  )}/${dateStr.substring(0, 4)}`;
};
const formatTime = (timeNum) => {
  if (timeNum === null || timeNum === undefined) return "";
  // แปลงตัวเลข (เช่น 93015) เป็น string "093015"
  const timeStr = Math.floor(timeNum).toString().padStart(6, "0");
  const hh = timeStr.substring(0, 2) || "00";
  const mm = timeStr.substring(2, 4) || "00";
  return `${hh}:${mm}`;
};

// ----- Reusable Components -----
const StatCard = ({ title, value, icon, unit = "" }) => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/30 p-6 rounded-2xl shadow-lg flex items-center space-x-4">
    <div className="p-3 rounded-full bg-blue-500/20 text-blue-700">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {value} <span className="text-lg font-normal">{unit}</span>
      </p>
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/30 p-6 rounded-2xl shadow-lg flex items-center space-x-4 animate-pulse">
    <div className="p-3 rounded-full bg-gray-300/50 h-12 w-12"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300/50 rounded w-1/2"></div>
      <div className="h-6 bg-gray-300/50 rounded w-3/4"></div>
    </div>
  </div>
);
// ------------------------------

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get("/api/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Today's Dashboard
      </h1>

      {/* ----- PACS Stat Cards ----- */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        PACS Stats
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Studies"
              value={data?.stats?.totalStudies || 0}
              icon={<Database size={24} />}
            />
            <StatCard
              title="Total Images"
              value={data?.stats?.totalImages || 0}
              icon={<Image size={24} />}
            />
            <StatCard
              title="Storage Received"
              value={data?.stats?.totalSizeMB?.toFixed(2) || 0}
              unit="MB"
              icon={<HardDrive size={24} />}
            />
          </>
        )}
      </div>

      {/* ----- Worklist Stat Cards ----- */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
        Worklist Stats (Today)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Scheduled"
              value={data?.worklistStats?.SCHEDULED || 0}
              icon={<ClipboardList size={24} />}
            />
            <StatCard
              title="In Progress"
              value={data?.worklistStats?.["IN PROGRESS"] || 0}
              icon={<RefreshCw size={24} />}
            />
            <StatCard
              title="Completed"
              value={data?.worklistStats?.COMPLETED || 0}
              icon={<CheckCircle size={24} />}
            />
          </>
        )}
      </div>

      {/* ----- Charts ----- */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
        Charts (Today)
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {isLoading ? (
          <>
            <div className="h-80 bg-white/80 rounded-2xl p-4 animate-pulse"></div>
            <div className="h-80 bg-white/80 rounded-2xl p-4 animate-pulse"></div>
          </>
        ) : (
          <>
            <DashboardBarChart
              title="Studies by Modality"
              data={data?.modalityChartData || []}
              dataKey="studyCount"
              icon={<BarChart3 size={20} />}
            />
            <DashboardBarChart
              title="Images by Source AE"
              data={data?.sourceAEChartData || []}
              dataKey="imageCount"
              icon={<BarChart3 size={20} />}
            />
          </>
        )}
      </div>

      {/* ----- Recent Studies ----- */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
        Recent Studies
      </h2>
      <div className="overflow-x-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50/80 dark:bg-gray-700/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                Accession No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                Study Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-300/50 rounded w-3/4"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-300/50 rounded w-1/2"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-300/50 rounded w-3/4"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-300/50 rounded w-1/4"></div>
                  </td>
                </tr>
              ))
            ) : data?.recentStudies?.length > 0 ? (
              data.recentStudies.map((study, index) => (
                <tr
                  // 👈 ใช้ index หรือ field ที่ unique กว่าถ้ามี
                  key={study.accession_number + index}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {study.ptn_name}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {study.accession_number}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {study.study_desc}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatDate(study.study_date)}{" "}
                    {formatTime(study.study_time)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 py-10">
                  No recent studies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// GSSP นี้ใช้สำหรับตรวจสอบสิทธิ์ (Auth) เท่านั้น
export async function getServerSideProps({ req, res }) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;
  if (!user || !user.isLoggedIn) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { user } };
}
