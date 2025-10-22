import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db"; // 👈 [สำคัญ] ตรวจสอบว่า lib/db.js ของคุณอยู่ที่นี่
import bcrypt from "bcryptjs"; // 👈 [สำคัญ] ต้อง npm install bcryptjs

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);

  // 1. ตรวจสอบสิทธิ์ (isLoggedIn)
  if (!session.user || !session.user.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. [ปรับปรุง] ตรวจสอบสิทธิ์ (Role Admin)
  // (แนะนำให้ตรวจสอบ Role Admin ในระบบจริง)
  if (session.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: Admin role required." });
  }

  try {
    const { method } = req;

    switch (method) {
      // ---------------------------------
      // GET: ดึงผู้ใช้ทั้งหมด
      // ---------------------------------
      case "GET": {
        const users = await query(
          "SELECT user_id, username, full_name, role FROM wkl_users ORDER BY username",
          {}
        );
        return res.status(200).json(users.recordset);
      }

      // ---------------------------------
      // POST: เพิ่มผู้ใช้ใหม่
      // ---------------------------------
      case "POST": {
        const { username, password, full_name, role } = req.body;
        if (!username || !password || !full_name || !role) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        // Hash รหัสผ่าน
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await query(
          `INSERT INTO wkl_users (username, password_hash, full_name, role) 
           VALUES (@username, @password_hash, @full_name, @role)`,
          { username, password_hash, full_name, role }
        );
        return res.status(201).json({ message: "User created successfully" });
      }

      // ---------------------------------
      // PUT: แก้ไขผู้ใช้
      // ---------------------------------
      case "PUT": {
        const { id } = req.query;
        const { username, password, full_name, role } = req.body;

        if (!id || !username || !full_name || !role) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        if (password) {
          // ถ้ามีการส่งรหัสผ่านใหม่มาด้วย (มีการเปลี่ยนรหัส)
          const salt = await bcrypt.genSalt(10);
          const password_hash = await bcrypt.hash(password, salt);
          await query(
            `UPDATE wkl_users 
             SET username = @username, password_hash = @password_hash, full_name = @full_name, role = @role 
             WHERE user_id = @id`,
            { username, password_hash, full_name, role, id }
          );
        } else {
          // ถ้าไม่เปลี่ยนรหัสผ่าน
          await query(
            `UPDATE wkl_users 
             SET username = @username, full_name = @full_name, role = @role 
             WHERE user_id = @id`,
            { username, full_name, role, id }
          );
        }
        return res.status(200).json({ message: "User updated successfully" });
      }

      // ---------------------------------
      // DELETE: ลบผู้ใช้
      // ---------------------------------
      case "DELETE": {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ message: "User ID required" });
        }
        await query("DELETE FROM wkl_users WHERE user_id = @id", { id });
        return res.status(200).json({ message: "User deleted successfully" });
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Users Error:", error);
    // (Check for specific errors, like duplicate username)
    if (error.number === 2627 || error.number === 2601) {
      // Unique constraint violation
      return res.status(409).json({ message: "Username already exists." });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
