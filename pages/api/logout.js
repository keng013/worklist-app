import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";

// API route นี้ไม่ต้องถูกห่อหุ้มอีกต่อไป
export default async function logoutRoute(req, res) {
  // 1. เข้าถึง session โดยใช้ getIronSession
  const session = await getIronSession(req, res, sessionOptions);

  // 2. ทำลาย session
  session.destroy();

  res.setHeader("cache-control", "no-store, max-age=0");
  res.status(200).json({ ok: true });
}
