import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db";

// Helper to convert YYYY-MM-DD (หรือ YYYYMMDD) to YYYYMMDD integer
const convertDateToInteger = (dateStr) => {
  if (!dateStr) return null;
  // รองรับทั้ง "2025-10-23" และ "20251023"
  const cleanedStr = dateStr.toString().replace(/-/g, "");
  if (cleanedStr.length !== 8) return null;
  return parseInt(cleanedStr, 10);
};

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user || !user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Extract query parameters
  const { source_ae, modality } = req.query;
  let { start_date, end_date } = req.query;

  // --- ⭐️ [แก้ไข] ตรวจสอบ "All" ---
  const isFetchingAll = req.query.limit === "all";

  // (parseInt("all") จะได้ NaN, NaN || 10 = 10 ซึ่งปลอดภัย)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // 3. (เปลี่ยนชื่อ) Set date range (Frontend ส่ง YYYYMMDD มาแล้ว)
  const startDateInt = convertDateToInteger(start_date);
  const endDateInt = convertDateToInteger(end_date);

  // 4. Build WHERE clause
  const conditions = [];
  const params = {};

  if (startDateInt) {
    conditions.push("study_date >= @start_date");
    params.start_date = startDateInt;
  }
  if (endDateInt) {
    conditions.push("study_date <= @end_date");
    params.end_date = endDateInt;
  }
  if (source_ae) {
    conditions.push("source_ae = @source_ae");
    params.source_ae = source_ae;
  }
  if (modality) {
    conditions.push("modality = @modality");
    params.modality = modality;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // 5. Construct SQL queries

  // 5.1 Count query (ไม่เปลี่ยนแปลง)
  const countQuery = `
    SELECT COUNT(*) as total_count 
    FROM dbo.StudyUtilizationSummary
    ${whereClause}
  `;

  // --- ⭐️ [แก้ไข] สร้าง SQL สำหรับแบ่งหน้าแบบไดนามิก ---
  let paginationSql = `
    ORDER BY study_date DESC, study_time DESC, ptn_id
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  if (isFetchingAll) {
    // ถ้าขอ "All", ให้ลบ OFFSET/FETCH ทิ้งไป
    paginationSql = `ORDER BY study_date DESC, study_time DESC, ptn_id`;
  }

  // 5.2 Main data query
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
    ${paginationSql} -- 👈 [แก้ไข] ใช้ SQL ที่สร้างแบบไดนามิก
  `;

  try {
    // 6. Execute queries
    const countResult = await query(countQuery, params);

    // --- ⭐️ [แก้ไข] กำหนดพารามิเตอร์สำหรับ main query ---
    let mainQueryParams = { ...params, offset, limit };
    if (isFetchingAll) {
      // ถ้า "All", ไม่ต้องส่ง offset/limit
      mainQueryParams = params;
    }

    const dataResult = await query(mainQuery, mainQueryParams);

    const studies = dataResult.recordset;
    const totalCount = countResult.recordset[0]?.total_count || 0;

    // --- ⭐️ [แก้ไข] ปรับค่า totalPages ถ้าเป็น "All" ---
    let responsePage = page;
    let responseTotalPages = Math.ceil(totalCount / limit); // (limit ที่เป็น NaN || 10)

    if (isFetchingAll) {
      responsePage = 1;
      responseTotalPages = 1; // ถ้าดึงมาทั้งหมด ก็มีแค่หน้าเดียว
    }

    // 7. Send the successful JSON response
    res.status(200).json({
      studies,
      totalCount,
      currentPage: responsePage, // 👈 [แก้ไข]
      totalPages: responseTotalPages, // 👈 [แก้ไข]
    });
  } catch (error) {
    console.error("API PACS Utilization Error:", error);
    res.status(500).json({ message: "Failed to fetch utilization data." });
  }
}
