import sql from "mssql";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user || !session.user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    const { db_host, db_port, db_name, db_user, db_pass } = req.body;

    // 1. สร้าง Config object สำหรับ mssql
    const config = {
      user: db_user,
      password: db_pass,
      server: db_host,
      port: parseInt(db_port, 10),
      database: db_name,
      options: {
        encrypt: true, // ใช้ true ถ้าเชื่อมต่อ Azure
        trustServerCertificate: true, // ใช้ true ถ้าเป็น local dev
      },
      pool: {
        max: 1, // ใช้แค่ 1 connection สำหรับ test
        min: 0,
        idleTimeoutMillis: 5000, // ปิด connection เร็วๆ
      },
    };

    let pool;
    try {
      // 2. พยายามเชื่อมต่อ
      console.log(`Attempting connection to ${db_host}:${db_port}...`);
      pool = await new sql.ConnectionPool(config).connect();

      // 3. ถ้าสำเร็จ
      res.status(200).json({ message: "Connection successful!" });
    } catch (err) {
      // 4. ถ้าล้มเหลว
      console.error("Test connection failed:", err.message);
      res.status(500).json({ message: `Connection failed: ${err.message}` });
    } finally {
      // 5. ปิด connection เสมอ
      if (pool) {
        await pool.close();
      }
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
