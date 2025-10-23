import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../lib/apiConfig";
import { useWorklistRouter } from "../hooks/useWorklistRouter";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";

// Import components
import Pagination from "../components/ui/Pagination";
import SkeletonRows from "../components/ui/SkeletonRows";

// ----- Helper Functions -----
const formatDate = (dateInt) => {
  if (!dateInt) return "";
  const dateStr = dateInt.toString();
  if (dateStr.length !== 8) return dateInt; // Return as-is if not YYYYMMDD
  // YYYYMMDD -> DD/MM/YYYY
  return `${dateStr.substring(6, 8)}/${dateStr.substring(
    4,
    6
  )}/${dateStr.substring(0, 4)}`;
};

const formatStudyTime = (timeNum) => {
  if (!timeNum && timeNum !== 0) return "";
  const timeStr = parseFloat(timeNum).toFixed(0).toString().padStart(6, "0");
  const hh = timeStr.substring(0, 2) || "00";
  const mm = timeStr.substring(2, 4) || "00";
  const ss = timeStr.substring(4, 6) || "00";
  return `${hh}:${mm}:${ss}`;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0.00";
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)}`;
};

// --- Options for new dropdowns ---
const monthDropdownOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
// -----------------------------

const PACSUtilizationPage = () => {
  const router = useWorklistRouter();
  const [data, setData] = useState([]);
  const [sourceAes, setSourceAes] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  // --- Generate Year Options (Fixed duplicate year) ---
  const yearDropdownOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 15; i++) {
      const year = currentYear - i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  }, []);

  // 🔹 ดึง Source AEs และ Modalities มาใส่ Filter
  // 🔹 ดึง Source AEs และ Modalities มาใส่ Filter
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [aeRes, modRes] = await Promise.all([
          apiClient.get("/api/sourceaes"),
          apiClient.get("/api/modalities"),
        ]);

        // 👇 [แก้] ให้รับ aeRes.data (ที่เป็น Array) ตรงๆ
        setSourceAes(aeRes.data || []);
        // 👇 [แก้] ให้รับ modRes.data (ที่เป็น Array) ตรงๆ
        setModalities(modRes.data || []);

        // 👇 [แก้ไข] Log ข้อมูลที่ได้มาจริงๆ
        console.log("Fetched filter data:", {
          sourceAes: aeRes.data || [],
          modalities: modRes.data || [],
        });
      } catch (err) {
        console.error("Failed to fetch filter data", err);
      }
    };
    fetchFilters();
  }, []);

  // 🔹 ดึงข้อมูล Utilization
  useEffect(() => {
    if (!router.isReady) return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- NEW: Logic for Month/Year filter ---
        const { month, year, ...restQuery } = router.query;
        const finalParams = new URLSearchParams(restQuery);

        if (year && month) {
          const yearNum = parseInt(year);
          const monthNum = parseInt(month); // 1-12
          const startDate = `${year}${month.padStart(2, "0")}01`;
          const lastDay = new Date(yearNum, monthNum, 0).getDate();
          const endDate = `${year}${month.padStart(2, "0")}${lastDay
            .toString()
            .padStart(2, "0")}`;
          finalParams.append("start_date", startDate);
          finalParams.append("end_date", endDate);
        } else if (year) {
          finalParams.append("start_date", `${year}0101`);
          finalParams.append("end_date", `${year}1231`);
        }
        // --- End of new logic ---

        const res = await apiClient.get(
          `/api/pacsutilization?${finalParams.toString()}`
        );

        setData(res.data.studies || []);
        setPagination({
          totalCount: res.data.totalCount || 0,
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          limit:
            router.query.limit === "all"
              ? "all"
              : parseInt(router.query.limit) || 10,
        });
      } catch (err) {
        console.error(err);
        setError("❌ Failed to fetch utilization data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router.isReady, router.query]);

  // 🔹 ฟังก์ชันจัดการ
  const handleNavigation = (newParams) => {
    router.push({ ...router.query, ...newParams });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filters = {};
    for (const [key, value] of formData.entries()) {
      if (value) filters[key] = value;
    }
    handleNavigation({ ...filters, page: 1 });
  };

  const handleLimitChange = (e) => {
    handleNavigation({ limit: e.target.value, page: 1 });
  };

  const handleReset = () => router.reset();

  // 🔹 ฟังก์ชัน Export Excel (ไม่เปลี่ยนแปลง)
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }
    const excelData = data.map((item) => ({
      "Patient ID": item.ptn_id,
      "Patient Name": item.ptn_name,
      "Accession Number": item.accession_number,
      "Study Description": item.study_desc,
      "Study Date": formatDate(item.study_date),
      "Study Time": formatStudyTime(item.study_time),
      "Source AE": item.source_ae,
      Modality: item.modality,
      Studies: item.study_count,
      Images: item.image_count,
      "Size (MB)": formatFileSize(item.total_size_bytes),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PACSUtilization");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      `pacs_utilization_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const tableHeaders = [
    "Patient ID",
    "Patient Name",
    "Accession Number",
    "Study Description",
    "Study Date",
    "Study Time",
    "Source AE",
    "Modality",
    "Studies",
    "Images",
    "Size (MB)",
  ];

  return (
    <>
      {/* 🔍 Filter Form */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-white/30 p-6 rounded-2xl shadow-xl mb-6">
        <form onSubmit={handleFilterSubmit} key={JSON.stringify(router.query)}>
          {/* [Responsive Change 1]
            เปลี่ยน grid-cols-1 md:grid-cols-4 
            เป็น grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* --- REPLACED: Month Dropdown --- */}
            <div>
              <label
                htmlFor="month"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Month
              </label>
              <select
                id="month"
                name="month"
                defaultValue={router.query.month || ""}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {monthDropdownOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* --- REPLACED: Year Dropdown --- */}
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Year
              </label>
              <select
                id="year"
                name="year"
                defaultValue={router.query.year || ""}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {yearDropdownOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* --- REPLACED: Source AE Dropdown --- */}
            <div>
              <label
                htmlFor="source_ae"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Source AE
              </label>
              <select
                id="source_ae"
                name="source_ae"
                defaultValue={router.query.source_ae || ""}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Source AEs</option>
                {sourceAes.map((ae) => (
                  <option key={ae} value={ae}>
                    {ae}
                  </option>
                ))}
              </select>
            </div>

            {/* --- REPLACED: Modality Dropdown --- */}
            <div>
              <label
                htmlFor="modality"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Modality
              </label>
              <select
                id="modality"
                name="modality"
                defaultValue={router.query.modality || ""}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Modalities</option>
                {modalities.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            {/* [Responsive Change 2]
              แทนที่ div ว่างๆ และ div ของปุ่ม 2 ปุ่ม
              ด้วย div ใหม่ที่จัดกลุ่มปุ่มและจัดเรียง responsive
            */}
            <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:justify-end gap-4 mt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow transition"
              >
                Reset
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 📋 Utilization Table */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          PACS Utilization
        </h2>
        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          Export Excel
        </button>
      </div>

      <div className="overflow-x-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm">
            <tr>
              {tableHeaders.map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <SkeletonRows rows={5} cols={tableHeaders.length} />
            ) : error ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="text-center text-red-500 py-10"
                >
                  {error}
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <tr
                  // [Fix] แก้ Key ให้ Unique มากขึ้น (ป้องกัน Warning)
                  key={`${item.accession_number}-${item.modality}-${item.source_ae}-${item.ptn_id}`}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.ptn_id}
                  </td>
                  {/* [Responsive Change 3]
                    ลบ whitespace-nowrap เพื่อให้ตัดคำได้
                  */}
                  <td className="px-6 py-4 text-sm dark:text-gray-200">
                    {item.ptn_name}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.accession_number}
                  </td>
                  {/* [Responsive Change 3]
                    ลบ whitespace-nowrap เพื่อให้ตัดคำได้
                  */}
                  <td className="px-6 py-4 text-sm dark:text-gray-200">
                    {item.study_desc}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatDate(item.study_date)}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatStudyTime(item.study_time)}
                  </td>
                  {/* [Fix] แก้ Typo "nowRrap" -> "nowrap"
                   */}
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.source_ae}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.modality}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.study_count}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.image_count}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatFileSize(item.total_size_bytes)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="text-center text-gray-500 dark:text-gray-400 py-10"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onNavigate={handleNavigation}
        onLimitChange={handleLimitChange}
      />
    </>
  );
};

export default PACSUtilizationPage;

// GSSP นี้ใช้สำหรับตรวจสอบสิทธิ์ (Auth) เท่านั้น
export async function getServerSideProps({ req, res }) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user || !user.isLoggedIn) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // ส่ง user prop ไปให้ _app.js และ Layout
  return { props: { user } };
}
