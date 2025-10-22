import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { query } from "../../lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);

  // 1. ตรวจสอบว่า Login อยู่หรือไม่
  if (!session.user || !session.user.isLoggedIn) {
    return res
      .status(401)
      .json({ message: "Unauthorized. Please log in again." });
  }

  // 2. ดึง user_id จาก session
  const { user_id } = session.user;

  if (req.method === "POST") {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    try {
      // 3. ดึงรหัสผ่าน hash ปัจจุบันจาก DB
      const result = await query(
        "SELECT password_hash FROM wkl_users WHERE user_id = @user_id",
        { user_id }
      );
      const user = result.recordset[0];

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // 4. เปรียบเทียบรหัสผ่านปัจจุบัน
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid current password." });
      }

      // 5. Hash รหัสผ่านใหม่
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // 6. อัปเดตลง DB
      await query(
        "UPDATE wkl_users SET password_hash = @newPasswordHash WHERE user_id = @user_id",
        { newPasswordHash, user_id }
      );

      return res
        .status(200)
        .json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Reset Password Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
