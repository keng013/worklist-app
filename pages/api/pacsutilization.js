import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db";

// ✅ แปลงวันที่เป็น integer (ถ้าจำเป็น)
const convertDateToInteger = (dateStr) => {
  if (!dateStr) return null;
  return parseInt(dateStr.replace(/-/g, ""), 10);
};
export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user || !user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { source_ae, modality } = req.query;
  let { start_date, end_date } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!start_date || !end_date) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    start_date = sevenDaysAgo.toISOString().split("T")[0];
    end_date = today.toISOString().split("T")[0];
  }

  // 4. Build WHERE clause (ปรับเล็กน้อย)
  const conditions = [];
  const params = {};

  const startDateInt = convertDateToInteger(start_date);
  const endDateInt = convertDateToInteger(end_date);

  if (startDateInt) {
    // ❌ ไม่ใช้ s.study_date
    // ✅ ใช้ study_date
    conditions.push("study_date >= @start_date");
    params.start_date = startDateInt;
  }
  if (endDateInt) {
    conditions.push("study_date <= @end_date");
    params.end_date = endDateInt;
  }
  if (source_ae) {
    // ❌ ไม่ใช้ i.source_ae
    // ✅ ใช้ source_ae
    conditions.push("source_ae = @source_ae");
    params.source_ae = source_ae;
  }
  if (modality) {
    // ❌ ไม่ใช้ se.modality
    // ✅ ใช้ modality
    conditions.push("modality = @modality");
    params.modality = modality;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // 5. [ปรับปรุง] Construct SQL queries (ง่ายขึ้นมาก!)

  const countQuery = `
    SELECT COUNT(*) as total_count 
    FROM dbo.StudyUtilizationSummary
    ${whereClause}
  `;

  const mainQuery = `
    SELECT 
      ptn_id,
      ptn_name,
      accession_number,
      study_desc,
      study_date,
      study_time,
      modality,
      source_ae,
      study_count,
      image_count,
      total_size_bytes
    FROM dbo.StudyUtilizationSummary
    ${whereClause}
    ORDER BY study_date DESC, study_time DESC, ptn_id
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  try {
    // 6. Execute the queries (แยกกันเหมือนเดิม)
    const countResult = await query(countQuery, params);
    const dataResult = await query(mainQuery, { ...params, offset, limit });

    const studies = dataResult.recordset;
    const totalCount = countResult.recordset[0]?.total_count || 0;
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
