import { promises as fs } from "fs";
import path from "path";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { encrypt } from "../../lib/crypto"; // 👈 Import encrypt

// กำหนด path ไปยังไฟล์ config ของเรา
const configFilePath = path.join(process.cwd(), "db_config.json");

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);

  // 1. ตรวจสอบสิทธิ์ (ควรเป็น Admin)
  if (
    !session.user ||
    !session.user.isLoggedIn ||
    session.user.role !== "Admin"
  ) {
    return res.status(403).json({ message: "Forbidden: Admins only." });
  }

  if (req.method === "POST") {
    try {
      const { db_host, db_port, db_name, db_user, db_pass } = req.body;

      // 2. อ่านค่า config เดิม (ถ้ามี)
      let currentConfig = {};
      try {
        const data = await fs.readFile(configFilePath, "utf8");
        currentConfig = JSON.parse(data);
      } catch (error) {
        // ไม่มีไฟล์เดิม ไม่เป็นไร
      }

      // 3. 🚀 [Logic แก้บั๊ก] ตรวจสอบและเข้ารหัสรหัสผ่าน
      let finalPasswordToSave;

      if (db_pass) {
        // 3a. ถ้า User ป้อนรหัสผ่านใหม่: เข้ารหัสอันใหม่
        finalPasswordToSave = encrypt(db_pass);
      } else {
        // 3b. ถ้า User ไม่ได้ป้อน:
        const oldPass = currentConfig.db_pass;

        if (oldPass && !oldPass.includes(":")) {
          // ถ้าค่าเก่าเป็น Plain text (ยังไม่ถูกเข้ารหัส)
          // ให้ "เข้ารหัส" ค่าเก่านั้นซะ
          console.log("Encrypting existing plain-text password...");
          finalPasswordToSave = encrypt(oldPass);
        } else {
          // ถ้าค่าเก่าถูกเข้ารหัสแล้ว (มี :) หรือค่าว่าง
          // ให้ใช้ค่าเดิมต่อไป
          finalPasswordToSave = oldPass;
        }
      }

      // 4. สร้าง object ใหม่
      const newConfig = {
        db_host: db_host || currentConfig.db_host,
        db_port: db_port || currentConfig.db_port,
        db_name: db_name || currentConfig.db_name,
        db_user: db_user || currentConfig.db_user,
        db_pass: finalPasswordToSave, // 👈 ใช้รหัสผ่านที่ผ่าน Logic แล้ว
      };

      // 5. เขียนทับไฟล์ config.json
      await fs.writeFile(
        configFilePath,
        JSON.stringify(newConfig, null, 2),
        "utf8"
      );

      res.status(200).json({
        message: "Settings saved successfully. (Password encrypted)",
      });
    } catch (error) {
      console.error("Failed to save config file:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
