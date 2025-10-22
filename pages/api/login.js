import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db";
import bcrypt from "bcryptjs"; // 👈 [สำคัญ] ต้อง npm install bcryptjs

export default async function loginHandler(req, res) {
  const { username, password } = req.body;
  const session = await getIronSession(req, res, sessionOptions);

  try {
    // 1. ค้นหา User (ดึงมาทั้งแถว)
    const result = await query(
      "SELECT * FROM wkl_users WHERE username = @username",
      { username }
    );
    const user = result.recordset[0];

    // 2. ตรวจสอบ User และ รหัสผ่าน
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      // 3. [สำคัญ] บันทึก Role และข้อมูลอื่นลง Session
      session.user = {
        isLoggedIn: true,
        user_id: user.user_id, // 👈 จำเป็นสำหรับ api/reset-password.js
        username: user.username,
        full_name: user.full_name,
        role: user.role, // 👈 จำเป็นสำหรับ api/users.js และหน้า setting
      };
      await session.save();

      return res.status(200).json(session.user);
    } else {
      // 4. ถ้า User หรือ รหัสผ่านผิด
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
