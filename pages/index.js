import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { query } from "../lib/db";
import { useRouter } from "next/router";

// Component หลักสำหรับหน้า Worklist
export default function WorklistPage({
  user,
  worklist,
  initialFilters,
  totalCount,
  currentPage,
  limit,
  totalPages,
  modalities,
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout");
    router.push("/login");
  };

  // Function to handle navigation and filter changes
  const handleNavigation = (newParams) => {
    const currentQuery = { ...router.query };
    const params = new URLSearchParams({
      ...currentQuery,
      ...newParams,
    });
    router.push(`/?${params.toString()}`);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newFilters = {};
    for (const [key, value] of formData.entries()) {
      if (value) {
        newFilters[key] = value;
      }
    }
    // When applying a new filter, always go back to page 1
    handleNavigation({ ...newFilters, page: 1 });
  };

  const handleLimitChange = (e) => {
    handleNavigation({ limit: e.target.value, page: 1 });
  };

  // Function to handle resetting filters
  const handleResetFilter = () => {
    // Simply navigate to the base URL to clear all filters from query string
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
            {/* Row 1 */}
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
                defaultValue={initialFilters.patient_id}
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
                defaultValue={initialFilters.accession_num}
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
                defaultValue={initialFilters.modality}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                {modalities.map((mod) => (
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
                defaultValue={initialFilters.status}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            {/* Row 2 */}
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
                defaultValue={initialFilters.start_date}
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
                defaultValue={initialFilters.end_date}
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
                  Modality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AE Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {worklist.map((item) => (
                <tr key={item.study_instance_uid} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.modality}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.perfrmd_aet}
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
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
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
              disabled={currentPage <= 1}
              className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handleNavigation({ page: currentPage + 1 })}
              disabled={currentPage >= totalPages}
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

export async function getServerSideProps({ req, res, query: urlQuery }) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user || !user.isLoggedIn) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  // Fetch distinct modalities for the dropdown
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

  // Pagination and Filter parameters
  const { patient_id, accession_num, modality, status } = urlQuery;
  let { start_date, end_date } = urlQuery;
  const page = parseInt(urlQuery.page) || 1;
  const limit = parseInt(urlQuery.limit) || 10;
  const offset = (page - 1) * limit;

  if (!start_date || !end_date) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    start_date = sevenDaysAgo.toISOString().split("T")[0];
    end_date = today.toISOString().split("T")[0];
  }

  // Build WHERE clause
  const conditions = [];
  const params = {};
  if (patient_id) {
    conditions.push("patient_id LIKE @patient_id");
    params.patient_id = `%${patient_id}%`;
  }
  if (accession_num) {
    conditions.push("accession_num LIKE @accession_num");
    params.accession_num = `%${accession_num}%`;
  }
  if (modality) {
    conditions.push("modality = @modality");
    params.modality = modality;
  }
  if (status) {
    if (status === "SCHEDULED") {
      conditions.push(
        "(perfrmd_status IS NULL OR perfrmd_status = '' OR perfrmd_status = 'SCHEDULED')"
      );
    } else {
      conditions.push("perfrmd_status = @status");
      params.status = status;
    }
  }
  if (start_date) {
    conditions.push("sched_start_date >= @start_date");
    params.start_date = start_date.replace(/-/g, "");
  }
  if (end_date) {
    conditions.push("sched_start_date <= @end_date");
    params.end_date = end_date.replace(/-/g, "");
  }
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Main Query with Pagination and Total Count
  const mainQuery = `
        SELECT 
            study_instance_uid, patient_id, patient_name, accession_num, modality, 
            sched_start_date, sched_start_time, perfrmd_status, perfrmd_aet,
            COUNT(*) OVER() as total_count
        FROM worklist
        ${whereClause}
        ORDER BY sched_start_date DESC, sched_start_time DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
    `;

  try {
    const result = await query(mainQuery, { ...params, offset, limit });
    const worklist = result.recordset;
    const totalCount = worklist.length > 0 ? worklist[0].total_count : 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      props: {
        user: user,
        worklist: JSON.parse(JSON.stringify(worklist)),
        totalCount,
        currentPage: page,
        limit,
        totalPages,
        modalities, // Pass the fetched modalities to the page
        initialFilters: {
          patient_id: patient_id || "",
          accession_num: accession_num || "",
          modality: modality || "",
          status: status || "",
          start_date: start_date || "",
          end_date: end_date || "",
        },
      },
    };
  } catch (error) {
    console.error("Error fetching worklist:", error);
    return {
      props: {
        user: user,
        worklist: [],
        totalCount: 0,
        currentPage: 1,
        limit,
        totalPages: 1,
        modalities,
        initialFilters: {},
      },
    };
  }
}
