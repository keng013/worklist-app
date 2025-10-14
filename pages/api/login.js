import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session"; // อ้างอิง Path ให้ถูกต้อง
import { query } from "../../lib/db"; // อ้างอิง Path ให้ถูกต้อง
import bcrypt from "bcryptjs";

// ไม่ต้องใช้ withSessionRoute แล้ว
export default async function loginRoute(req, res) {
  // อนุญาตเฉพาะเมธอด POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    // 1. ค้นหาผู้ใช้จากฐานข้อมูล
    const result = await query(
      `SELECT user_id, username, password_hash FROM wkl_users WHERE username = @username`,
      { username }
    );
    const user = result.recordset[0];

    // ถ้าไม่พบผู้ใช้
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // 2. เปรียบเทียบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    // ถ้ารหัสผ่านไม่ถูกต้อง
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // 3. เข้าถึง session ด้วย getIronSession
    const session = await getIronSession(req, res, sessionOptions);

    // 4. ตั้งค่าข้อมูล session
    session.user = {
      id: user.user_id,
      username: user.username,
      isLoggedIn: true,
    };
    // 5. บันทึก session
    await session.save();

    res.status(200).json({ isLoggedIn: true, username: user.username });
  } catch (error) {
    console.error("Login API Error:", error);
    res.status(500).json({ message: "An internal server error occurred." });
  }
}
