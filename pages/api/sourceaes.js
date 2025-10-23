import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db";

export default async function handler(req, res) {
  // 1. Authentication Check (สำคัญมาก!)
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user || !session.user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // 2. Query ข้อมูลที่ไม่ซ้ำกันจากตารางสรุป
    const sqlQuery = `
      SELECT DISTINCT source_ae
      FROM dbo.StudyUtilizationSummary
      ORDER BY source_ae ASC
    `;

    const result = await query(sqlQuery);

    // 3. Map ผลลัพธ์ให้เป็น Array ของ String
    const sourceAEs = result.recordset.map((row) => row.source_ae);

    res.status(200).json(sourceAEs);
  } catch (error) {
    console.error("API /api/sourceaes Error:", error);
    res.status(500).json({ message: "Failed to fetch source AEs" });
  }
}
