import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db"; // สมมติว่า DB helper อยู่ที่นี่

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  // 1. ตรวจสอบสิทธิ์
  if (!user || !user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Query เพื่อดึงค่า Modality ที่ไม่ซ้ำกัน
  try {
    const sql = `
      SELECT DISTINCT modality 
      FROM worklist 
      WHERE modality IS NOT NULL AND modality != ''
      ORDER BY modality ASC
    `;

    const result = await query(sql, {});

    // แปลง array of objects [{ modality: 'CT' }, { modality: 'MR' }]
    // ให้เป็น array of strings ['CT', 'MR']
    const modalities = result.recordset.map((item) => item.modality);

    res.status(200).json({ modalities: modalities });
  } catch (error) {
    console.error("API Modalities Error:", error);
    res.status(500).json({ message: "Failed to fetch modalities." });
  }
}
