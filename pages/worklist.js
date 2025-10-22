import React, { useState, useEffect } from "react";
import { apiClient } from "../lib/apiConfig"; // 👈 ตรวจสอบ path
import { useWorklistRouter } from "../hooks/useWorklistRouter"; // 👈 ตรวจสอบ path
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// 👈 Import components
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import StatusBadge from "../components/ui/StatusBadge";
import SkeletonRows from "../components/ui/SkeletonRows";
import DatePickerInput from "../components/ui/DatePickerInput"; // 👈 Import คอมโพเนนต์ใหม่

// ----- Helper Functions -----
// (API ของคุณส่ง YYYYMMDD และ HHMMSS)
const formatDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return "";
  // YYYYMMDD -> DD/MM/YYYY
  return `${dateStr.substring(6, 8)}/${dateStr.substring(
    4,
    6
  )}/${dateStr.substring(0, 4)}`;
};

const formatTime = (timeStr) => {
  if (!timeStr || timeStr.length < 4) return "";
  // HHMMSS -> HH:MM:SS
  const hh = timeStr.substring(0, 2) || "00";
  const mm = timeStr.substring(2, 4) || "00";
  const ss = timeStr.substring(4, 6) || "00";
  return `${hh}:${mm}:${ss}`;
};
// -----------------------------

const WorklistPage = () => {
  const router = useWorklistRouter();
  const [worklist, setWorklist] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  // 🔹 ดึง modalities ครั้งแรก
  useEffect(() => {
    const fetchModalities = async () => {
      try {
        const res = await apiClient.get("/api/modalities");
        setModalities(res.data.modalities || []);
      } catch (err) {
        console.error("Failed to fetch modalities", err);
      }
    };
    fetchModalities();
  }, []);

  // 🔹 ดึง Worklist เมื่อ query เปลี่ยน
  useEffect(() => {
    if (!router.isReady) return;
    const fetchWorklist = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // API (api/worklist.js) คาดหวัง start_date/end_date
        // เราจะแปลง from_date/to_date จาก query (ถ้ามี)
        const queryParams = { ...router.query };
        if (queryParams.from_date) {
          queryParams.start_date = queryParams.from_date;
          // delete queryParams.from_date; // ลบหรือไม่ลบก็ได้
        }
        if (queryParams.to_date) {
          queryParams.end_date = queryParams.to_date;
          // delete queryParams.to_date;
        }

        const finalParams = new URLSearchParams(queryParams);
        const res = await apiClient.get(
          `/api/worklist?${finalParams.toString()}`
        );

        setWorklist(res.data.worklist || []);
        setPagination({
          totalCount: res.data.totalCount || 0,
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          limit: parseInt(router.query.limit) || 10,
        });
      } catch (err) {
        console.error(err);
        setError("❌ Failed to fetch worklist.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorklist();
  }, [router.isReady, router.query]);

  // 🔹 ฟังก์ชันจัดการ
  const handleNavigation = (params) => router.push(params);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filters = {};
    for (const [key, value] of formData.entries()) {
      if (value) filters[key] = value;
    }
    // ส่ง filters (เช่น from_date, to_date) ไปที่ router
    handleNavigation({ ...filters, page: 1 });
  };

  const handleLimitChange = (e) => {
    handleNavigation({ ...router.query, limit: e.target.value, page: 1 });
  };

  const handleReset = () => router.reset();

  // 🔹 Export Excel (อัปเดต Field ให้ตรงกับตารางใหม่)
  const exportToExcel = () => {
    if (!worklist || worklist.length === 0) {
      alert("No data to export");
      return;
    }

    const data = worklist.map((item) => ({
      "PATIENT ID": item.patient_id,
      "PATIENT NAME": item.patient_name,
      "STUDY DATE": formatDate(item.sched_start_date),
      "ACCESSION NO.": item.accession_num,
      "STUDY DESC": item.sched_proc_desc, // 👈 Field ใหม่
      MODALITY: item.modality,
      "AE TITLE": item.perfrmd_aet, // 👈 Field ใหม่
      "END DATE": formatDate(item.perfrmd_end_date), // 👈 Field ใหม่
      "END TIME": formatTime(item.perfrmd_end_time), // 👈 Field ใหม่
      STATUS: item.perfrmd_status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Worklist");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `worklist_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // 👈 ค่า Default สำหรับ Date Pickers
  // (ดึงจาก router query เพื่อให้ค่าคงอยู่หลัง Search)
  const defaultStartDate =
    router.query.from_date || router.query.start_date || "";
  const defaultEndDate = router.query.to_date || router.query.end_date || "";

  return (
    <>
      {/* 🔍 Filter Form - Layout 4x2 ใหม่ */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-white/30 p-6 rounded-2xl shadow-xl mb-6">
        <form
          onSubmit={handleFilterSubmit}
          key={JSON.stringify(router.query)} // 👈 เพิ่ม KEY ตรงนี้เพื่อแก้ปัญหา RESET
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* --- แถวที่ 1 --- */}
            <Input
              label="Patient ID"
              name="patient_id"
              defaultValue={router.query.patient_id}
            />
            <Input
              label="Accession No."
              name="accession_num"
              defaultValue={router.query.accession_num}
            />
            <Select
              label="Modality"
              name="modality"
              options={modalities}
              defaultValue={router.query.modality}
            />
            <Select
              label="Status"
              name="status"
              options={["SCHEDULED", "IN PROGRESS", "COMPLETED"]}
              defaultValue={router.query.status}
            />

            {/* --- แถวที่ 2 --- */}
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

            {/* ช่องปุ่ม Search (ปรับให้มี Label ปลอมเพื่อจัดตำแหน่ง) */}
            <div>
              <label className="block text-sm font-medium text-transparent dark:text-transparent">
                &nbsp; {/* Label ว่างสำหรับดันปุ่มลงมา */}
              </label>
              <button
                type="submit"
                className="mt-1 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
              >
                Search
              </button>
            </div>

            {/* ช่องปุ่ม Reset (ปรับให้มี Label ปลอมเพื่อจัดตำแหน่ง) */}
            <div>
              <label className="block text-sm font-medium text-transparent dark:text-transparent">
                &nbsp; {/* Label ว่างสำหรับดันปุ่มลงมา */}
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

      {/* 📤 Export + 📋 Worklist Table */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          Worklist
        </h2>
        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          Export Excel
        </button>
      </div>

      <div className="overflow-x-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg">
        {" "}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm">
            {/* 👈 Headers ใหม่ */}
            <tr>
              {[
                "PATIENT ID",
                "PATIENT NAME",
                "STUDY DATE",
                "ACCESSION NO.",
                "STUDY DESC",
                "MODALITY",
                "AE TITLE",
                "END DATE",
                "END TIME",
                "STATUS",
              ].map((h) => (
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
              <SkeletonRows rows={5} cols={10} /> /* 👈 อัปเดต cols */
            ) : error ? (
              <tr>
                <td colSpan="10" className="text-center text-red-500 py-10">
                  {error}
                </td>
              </tr>
            ) : worklist.length > 0 ? (
              worklist.map((item) => (
                <tr
                  key={item.study_instance_uid}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                >
                  {/* 👈 Data Fields ใหม่ */}
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.patient_id}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.patient_name}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatDate(item.sched_start_date)}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.accession_num}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.sched_proc_desc}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.modality}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {item.perfrmd_aet}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatDate(item.perfrmd_end_date)}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                    {formatTime(item.perfrmd_end_time)}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <StatusBadge status={item.perfrmd_status || "SCHEDULED"} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="10" // 👈 Colspan ใหม่
                  className="text-center text-gray-500 dark:text-gray-400 py-10"
                >
                  No worklist items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 👈 Pagination component จะใช้ Layout ใหม่จากไฟล์ที่แก้ */}
      <Pagination
        pagination={pagination}
        onNavigate={handleNavigation}
        onLimitChange={handleLimitChange}
      />
    </>
  );
};

export default WorklistPage;
