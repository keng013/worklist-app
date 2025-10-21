import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db";

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  // 1. Authentication Check: Ensure user is logged in
  if (!user || !user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Extract query parameters for filtering and pagination
  const { patient_id, accession_num, modality, status } = req.query;
  let { start_date, end_date } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // 3. Set default date range if not provided
  if (!start_date || !end_date) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    start_date = sevenDaysAgo.toISOString().split("T")[0];
    end_date = today.toISOString().split("T")[0];
  }

  // 4. Build the WHERE clause dynamically
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

  // 5. Construct the main SQL query for fetching data and total count
  const mainQuery = `
        SELECT
            study_instance_uid, patient_id, patient_name, accession_num, modality, 
            sched_start_date, sched_start_time, perfrmd_status, perfrmd_aet,
            sched_proc_desc, perfrmd_end_date, perfrmd_end_time,
            COUNT(*) OVER() as total_count
        FROM worklist
        ${whereClause}
        ORDER BY sched_start_date DESC, sched_start_time DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
    `;

  try {
    // 6. Execute the query
    const result = await query(mainQuery, { ...params, offset, limit });
    const worklist = result.recordset;
    const totalCount = worklist.length > 0 ? worklist[0].total_count : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // 7. Send the successful JSON response
    res.status(200).json({
      worklist,
      totalCount,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("API Worklist Error:", error);
    res.status(500).json({ message: "Failed to fetch worklist data." });
  }
}
