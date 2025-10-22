import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session"; // 👈 ตรวจสอบ Path นี้ให้ถูกต้อง

export default async function userHandler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);

  if (session.user) {
    // ส่งข้อมูล user กลับไป (รวมถึง isLoggedIn)
    res.status(200).json(session.user);
  } else {
    // ถ้าไม่มี session
    res.status(200).json({ isLoggedIn: false });
  }
}
