import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db"; // 👈 ตรวจสอบ path

// Helper to convert YYYY-MM-DD to YYYYMMDD integer
const convertDateToInteger = (dateStr) => {
  if (!dateStr) return null;
  return parseInt(dateStr.replace(/-/g, ""), 10);
};

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  // 1. Authentication Check
  if (!user || !user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Extract query parameters
  const { source_ae, modality } = req.query; // 👈 [เพิ่ม] modality
  let { start_date, end_date } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // 3. Set default date range if not provided (7 days)
  if (!start_date || !end_date) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    start_date = sevenDaysAgo.toISOString().split("T")[0];
    end_date = today.toISOString().split("T")[0];
  }

  // 4. Build WHERE clause dynamically
  const conditions = [];
  const params = {};

  const startDateInt = convertDateToInteger(start_date);
  const endDateInt = convertDateToInteger(end_date);

  if (startDateInt) {
    conditions.push("s.study_date >= @start_date");
    params.start_date = startDateInt;
  }
  if (endDateInt) {
    conditions.push("s.study_date <= @end_date");
    params.end_date = endDateInt;
  }
  if (source_ae) {
    conditions.push("i.source_ae = @source_ae");
    params.source_ae = source_ae;
  }
  if (modality) {
    // 👈 [เพิ่ม] Filter Modality
    conditions.push("se.modality = @modality");
    params.modality = modality;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // 5. Construct the main SQL query
  const mainQuery = `
    WITH GroupedData AS (
      SELECT
        p.ptn_id,
        p.ptn_name,
        s.accession_number,
        s.study_desc,
        s.study_date,
        s.study_time, -- 👈 [เพิ่ม] Study Time
        se.modality,
        i.source_ae,
        COUNT(DISTINCT s.study_uid_id) as study_count,
        COUNT(i.instance_uid) as image_count,
        SUM(CAST(i.file_size AS BIGINT)) as total_size_bytes 
      FROM patient1 p
      JOIN study1 s ON p.ptn_id_id = s.ptn_id_id
      JOIN series1 se ON s.study_uid_id = se.study_uid_id
      JOIN image1 i ON se.series_uid_id = i.series_uid_id
      ${whereClause}
      GROUP BY
        p.ptn_id, p.ptn_name, s.accession_number, s.study_desc, s.study_date, s.study_time, se.modality, i.source_ae -- 👈 [เพิ่ม] Study Time
    ),
    CountedData AS (
      SELECT *,
        COUNT(*) OVER() as total_count
      FROM GroupedData
    )
    SELECT *
    FROM CountedData
    ORDER BY study_date DESC, study_time DESC, ptn_id
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  try {
    // 6. Execute the query
    const result = await query(mainQuery, { ...params, offset, limit });
    const studies = result.recordset;

    const totalCount = studies.length > 0 ? studies[0].total_count : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // 7. Send the successful JSON response
    res.status(200).json({
      studies,
      totalCount,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("API PACS Utilization Error:", error);
    res.status(500).json({ message: "Failed to fetch utilization data." });
  }
}
