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

  // 2. Query เพื่อดึง Source AEs
  try {
    const sql = `
      SELECT DISTINCT source_ae 
      FROM image1 
      WHERE source_ae IS NOT NULL AND source_ae != ''
      ORDER BY source_ae ASC
    `;

    const result = await query(sql, {});

    // แปลง [{ source_ae: 'AE1' }, { source_ae: 'AE2' }]
    // เป็น ['AE1', 'AE2']
    const sourceAes = result.recordset.map((item) => item.source_ae);

    res.status(200).json({ sourceAes: sourceAes });
  } catch (error) {
    console.error("API SourceAEs Error:", error);
    res.status(500).json({ message: "Failed to fetch source AEs." });
  }
}
