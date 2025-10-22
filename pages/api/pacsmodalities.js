import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db"; // 👈 ตรวจสอบ path

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  // 1. Authentication Check
  if (!user || !user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Query เพื่อดึง Modalities จากตาราง series1
  try {
    const sql = `
      SELECT DISTINCT modality 
      FROM series1 
      WHERE modality IS NOT NULL AND modality != ''
      ORDER BY modality ASC
    `;

    const result = await query(sql, {});

    // แปลง [{ modality: 'CT' }, { modality: 'MR' }]
    // เป็น ['CT', 'MR']
    const modalities = result.recordset.map((item) => item.modality);

    res.status(200).json({ modalities: modalities });
  } catch (error) {
    console.error("API Modalities Error:", error);
    res.status(500).json({ message: "Failed to fetch modalities." });
  }
}
