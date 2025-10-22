import { promises as fs } from "fs";
import path from "path";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";

// กำหนด path ไปยังไฟล์ config ของเรา
// path.join(process.cwd(), ...) จะชี้ไปที่ Root ของโปรเจกต์
const configFilePath = path.join(process.cwd(), "db_config.json");

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user || !session.user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // (ใน Production จริง ควรเช็ค Role "Admin" ที่นี่)
  // if (session.user.role !== 'Admin') {
  //   return res.status(403).json({ message: "Forbidden" });
  // }

  if (req.method === "GET") {
    try {
      // 1. พยายามอ่านไฟล์ config.json
      const data = await fs.readFile(configFilePath, "utf8");
      res.status(200).json(JSON.parse(data));
    } catch (error) {
      // 2. ถ้าไฟล์ไม่มี (ENOENT = Error No Entry)
      if (error.code === "ENOENT") {
        // 3. ส่งค่าเริ่มต้น (จาก .env) กลับไปแทน
        // นี่คือวิธีที่ปลอดภัยที่สุด: อ่านจาก .env ที่ตั้งค่าไว้บน Server
        res.status(200).json({
          db_host: process.env.DB_HOST || "localhost",
          db_port: process.env.DB_PORT || "1433",
          db_name: process.env.DB_NAME || "pacsdb",
          db_user: process.env.DB_USER || "sa",
          db_pass: "", // ไม่ส่งรหัสผ่านจริงกลับไปเด็ดขาด
        });
      } else {
        // ถ้ามีข้อผิดพลาดอื่นๆ
        console.error("Failed to read config file:", error);
        res.status(500).json({ message: "Failed to read settings" });
      }
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
