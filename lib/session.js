// lib/session.js

// ไฟล์นี้จะ export แค่ object การตั้งค่าเท่านั้น
// เพื่อให้สามารถนำไปใช้กับ getIronSession ได้ในทุกที่

export const sessionOptions = {
  // รหัสผ่านลับที่ดึงมาจาก .env.local ต้องมีความยาวอย่างน้อย 32 ตัวอักษร
  password: process.env.SESSION_SECRET,

  // ชื่อของคุกกี้ที่จะถูกเก็บใน browser
  cookieName: "worklist-app-session",

  // ตัวเลือกสำหรับคุกกี้เพื่อความปลอดภัยในระดับ production
  // `secure: true` จะทำให้คุกกี้ถูกส่งผ่าน HTTPS เท่านั้น
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true, // ป้องกันการเข้าถึงคุกกี้ผ่าน JavaScript ฝั่ง client
  },
};
