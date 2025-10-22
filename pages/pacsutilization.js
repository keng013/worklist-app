import React, { useState, useEffect } from "react";
import { apiClient } from "../lib/apiConfig";
import { useWorklistRouter } from "../hooks/useWorklistRouter";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
// Import components
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import SkeletonRows from "../components/ui/SkeletonRows";
import DatePickerInput from "../components/ui/DatePickerInput";

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
  // แปลง NUMERIC (เช่น 143000.123) -> "143000" -> "14:30:00"
  // .toFixed(0) เพื่อตัดทศนิยม
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

  // 🔹 ดึง Source AEs และ Modalities มาใส่ Filter
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [aeRes, modRes] = await Promise.all([
          apiClient.get("/api/sourceaes"),
          apiClient.get("/api/modalities"),
        ]);
        setSourceAes(aeRes.data.sourceAes || []);
        setModalities(modRes.data.modalities || []);
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
        const queryParams = { ...router.query };
        if (queryParams.from_date) {
          queryParams.start_date = queryParams.from_date;
        }
        if (queryParams.to_date) {
          queryParams.end_date = queryParams.to_date;
        }

        const finalParams = new URLSearchParams(queryParams);
        const res = await apiClient.get(
          `/api/pacsutilization?${finalParams.toString()}`
        );

        setData(res.data.studies || []);
        setPagination({
          totalCount: res.data.totalCount || 0,
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          limit: parseInt(router.query.limit) || 10,
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

  // 🔹 ฟังก์ชันจัดการ (อัปเดตล่าสุด)
  // ฟังก์ชันนี้จะ "รวม" params ใหม่ (เช่น {page: 2}) เข้ากับ query เดิม (ที่มี filter) เสมอ
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
    // ส่ง Filter ใหม่ พร้อมกับบังคับไปหน้า 1
    handleNavigation({ ...filters, page: 1 });
  };

  const handleLimitChange = (e) => {
    // ส่ง Limit ใหม่ พร้อมกับบังคับไปหน้า 1 (query เดิมจะถูกเก็บไว้โดย handleNavigation)
    handleNavigation({ limit: e.target.value, page: 1 });
  };

  const handleReset = () => router.reset();

  // 🔹 ฟังก์ชัน Export Excel
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

  const defaultStartDate =
    router.query.from_date || router.query.start_date || "";
  const defaultEndDate = router.query.to_date || router.query.end_date || "";

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
        <form
          onSubmit={handleFilterSubmit}
          key={JSON.stringify(router.query)} // 👈 Key สำหรับ Reset
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* --- แถวที่ 1 --- */}
            <DatePickerInput
              label="From Date"
              name="from_date"
              defaultValue={defaultStartDate}
            />
            <DatePickerInput
              label="To Date"
              name="to_date"
              defaultValue={defaultEndDate}
            />
            <Select
              label="Source AE"
              name="source_ae"
              options={sourceAes}
              defaultValue={router.query.source_ae}
            />
            <Select
              label="Modality"
              name="modality"
              options={modalities}
              defaultValue={router.query.modality}
            />

            {/* --- แถวที่ 2 (ปุ่ม) --- */}
            <div className="md:col-span-2"></div>
            <div>
              <label className="block text-sm font-medium text-transparent">
                &nbsp;
              </label>
              <button
                type="submit"
                className="mt-1 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
              >
                Search
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-transparent">
                &nbsp;
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="mt-1 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow transition"
              >
                Reset
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
                  key={`${item.accession_number}-${item.modality}-${index}`}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.ptn_id}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.ptn_name}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.accession_number}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.study_desc}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatDate(item.study_date)}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatStudyTime(item.study_time)}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowGrap">
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
