import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db";
import { format } from "date-fns"; // (ต้อง install: npm install date-fns)

/**
 * Helper: แปลง Date object เป็น YYYYMMDD (integer)
 */
const getTodayInteger = () => {
  return parseInt(format(new Date(), "yyyyMMdd"));
};

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  // 1. Authentication Check
  if (!user || !user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const todayInt = getTodayInteger();

  try {
    // 2. Define all queries
    const params = { today: todayInt };

    // Query 1: Total Studies Today
    const studiesQuery = query(
      "SELECT COUNT(*) as totalStudies FROM study1 WHERE study_date = @today",
      params
    );

    // Query 2: Total Images & Storage Today
    const imagesQuery = query(
      "SELECT COUNT(*) as totalImages, SUM(CONVERT(bigint, file_size)) as totalSizeBytes FROM image1 WHERE rcvd_date = @today",
      params
    );

    // Query 3: Studies by Modality Today
    const modalityQuery = query(
      `SELECT TOP 7 se.modality, COUNT(DISTINCT s.study_uid) as studyCount 
       FROM study1 s 
       JOIN series1 se ON s.study_uid_id = se.study_uid_id 
       WHERE s.study_date = @today 
       GROUP BY se.modality 
       ORDER BY studyCount DESC`,
      params
    );

    // Query 4: Images by Source AE Today
    const sourceAEQuery = query(
      `SELECT TOP 7 i.source_ae, COUNT(*) as imageCount 
       FROM image1 i 
       WHERE i.rcvd_date = @today AND i.source_ae IS NOT NULL
       GROUP BY i.source_ae 
       ORDER BY imageCount DESC`,
      params
    );

    // Query 5: Recent 5 Studies
    const recentStudiesQuery = query(
      `SELECT TOP 5 p.ptn_name, s.study_desc, s.accession_number, s.study_date, s.study_time 
       FROM study1 s 
       JOIN patient1 p ON s.ptn_id_id = p.ptn_id_id 
       ORDER BY s.study_date DESC, s.study_time DESC`,
      {}
    );

    // 👈 [ใหม่] Query 6: Worklist Status Today
    const worklistStatusQuery = query(
      `SELECT 
         COALESCE(NULLIF(perfrmd_status, ''), 'SCHEDULED') as status, 
         COUNT(*) as statusCount 
       FROM worklist 
       WHERE sched_start_date = @today 
       GROUP BY COALESCE(NULLIF(perfrmd_status, ''), 'SCHEDULED')`,
      params
    );

    // 3. Execute all queries in parallel
    const [
      studiesResult,
      imagesResult,
      modalityResult,
      sourceAEResult,
      recentStudiesResult,
      worklistStatusResult, // 👈 [ใหม่]
    ] = await Promise.all([
      studiesQuery,
      imagesQuery,
      modalityQuery,
      sourceAEQuery,
      recentStudiesQuery,
      worklistStatusQuery, // 👈 [ใหม่]
    ]);

    // 4. Format the response
    const stats = {
      totalStudies: studiesResult.recordset[0]?.totalStudies || 0,
      totalImages: imagesResult.recordset[0]?.totalImages || 0,
      totalSizeMB:
        (imagesResult.recordset[0]?.totalSizeBytes || 0) / 1024 / 1024,
    };

    // 👈 [ใหม่] 4b. Format Worklist Stats
    const worklistStats = {
      SCHEDULED: 0,
      "IN PROGRESS": 0,
      COMPLETED: 0,
    };
    worklistStatusResult.recordset.forEach((row) => {
      if (worklistStats.hasOwnProperty(row.status)) {
        worklistStats[row.status] = row.statusCount;
      }
    });

    const modalityChartData = modalityResult.recordset;
    const sourceAEChartData = sourceAEResult.recordset;
    const recentStudies = recentStudiesResult.recordset;

    // 5. Send successful JSON response
    res.status(200).json({
      stats,
      modalityChartData,
      sourceAEChartData,
      recentStudies,
      worklistStats, // 👈 [ใหม่]
    });
  } catch (error) {
    console.error("API Dashboard Error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
}
