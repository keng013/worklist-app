import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { query } from "../lib/db"; // Still used for initial modalities fetch
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function WorklistPage({ user, initialModalities }) {
  const router = useRouter();

  // State สำหรับจัดการข้อมูลฝั่ง Client
  const [worklist, setWorklist] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect จะทำงานทุกครั้งที่ URL query เปลี่ยน (เช่น เปลี่ยนหน้า, ฟิลเตอร์)
  useEffect(() => {
    // router.isReady เพื่อให้แน่ใจว่า query params พร้อมใช้งานแล้ว
    if (!router.isReady) return;

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams(router.query);

    // เรียก API เพื่อดึงข้อมูล
    fetch(`/api/worklist?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch data from the server.");
        }
        return res.json();
      })
      .then((data) => {
        setWorklist(data.worklist);
        setTotalCount(data.totalCount);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setLimit(parseInt(router.query.limit) || 10);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router.isReady, router.query]);

  const handleLogout = async () => {
    await fetch("/api/logout");
    router.push("/login");
  };

  const handleNavigation = (newParams) => {
    const currentQuery = { ...router.query };
    const params = new URLSearchParams({ ...currentQuery, ...newParams });
    router.push(`/?${params.toString()}`);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newFilters = {};
    for (const [key, value] of formData.entries()) {
      if (value) newFilters[key] = value;
      else delete router.query[key];
    }
    handleNavigation({ ...newFilters, page: 1 });
  };

  const handleLimitChange = (e) => {
    handleNavigation({ limit: e.target.value, page: 1 });
  };

  const handleResetFilter = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">DICOM Worklist</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <form
            onSubmit={handleFilterSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Filters */}
            <div>
              <label
                htmlFor="patient_id"
                className="block text-sm font-medium text-gray-700"
              >
                Patient ID
              </label>
              <input
                type="text"
                name="patient_id"
                id="patient_id"
                defaultValue={router.query.patient_id || ""}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="accession_num"
                className="block text-sm font-medium text-gray-700"
              >
                Accession No.
              </label>
              <input
                type="text"
                name="accession_num"
                id="accession_num"
                defaultValue={router.query.accession_num || ""}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="modality"
                className="block text-sm font-medium text-gray-700"
              >
                Modality
              </label>
              <select
                name="modality"
                id="modality"
                defaultValue={router.query.modality || ""}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                {initialModalities.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                name="status"
                id="status"
                defaultValue={router.query.status || ""}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-gray-700"
              >
                From Date
              </label>
              <input
                type="date"
                name="start_date"
                id="start_date"
                defaultValue={router.query.start_date || ""}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-gray-700"
              >
                To Date
              </label>
              <input
                type="date"
                name="end_date"
                id="end_date"
                defaultValue={router.query.end_date || ""}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-2 self-end">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Table and Loading/Error States */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Study Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accession No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Study DESC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AE Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : worklist.length > 0 ? (
                worklist.map((item) => (
                  <tr
                    key={item.study_instance_uid}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.patient_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.patient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.sched_start_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.accession_num}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 truncate max-w-xs">
                      {item.sched_proc_desc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.modality}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.perfrmd_aet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.perfrmd_end_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.perfrmd_end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.perfrmd_status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : item.perfrmd_status === "IN PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.perfrmd_status || "SCHEDULED"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    No worklist items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="hidden sm:inline-block">
              | Total: {totalCount} items
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handleNavigation({ page: currentPage - 1 })}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handleNavigation({ page: currentPage + 1 })}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </main>
      <footer className="w-full py-4 text-center bg-white shadow-inner mt-auto">
        <p className="text-gray-500 text-sm">
          Copyright © 2025 MD Healthcare. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// getServerSideProps ถูกปรับให้ง่ายลง
// ทำหน้าที่ป้องกันหน้าและดึงข้อมูลเริ่มต้น (เช่น Modalities)
export async function getServerSideProps({ req, res }) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  // ป้องกัน Route ฝั่ง Server
  if (!user || !user.isLoggedIn) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  // ดึงรายชื่อ Modality สำหรับ dropdown ตอนโหลดหน้าครั้งแรก
  let modalities = [];
  try {
    const modalityResult = await query(`
            SELECT DISTINCT modality 
            FROM worklist 
            WHERE modality IS NOT NULL AND modality <> '' 
            ORDER BY modality
        `);
    modalities = modalityResult.recordset.map((row) => row.modality);
  } catch (error) {
    console.error("Error fetching modalities:", error);
  }

  // ส่ง props ที่จำเป็นไปให้ Component
  return {
    props: {
      user,
      initialModalities: modalities,
    },
  };
}
