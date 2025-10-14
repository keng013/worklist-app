import sql from "mssql";

// การตั้งค่าการเชื่อมต่อฐานข้อมูล
// ดึงค่ามาจากไฟล์ .env.local ที่เราสร้างไว้
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: false, // สำหรับการใช้งานบน Localhost หรือถ้าไม่ได้ใช้ SSL
    trustServerCertificate: true, // สำหรับการใช้งานบน Localhost
  },
};

// สร้าง Connection Pool เพื่อจัดการการเชื่อมต่ออย่างมีประสิทธิภาพ
// เราจะสร้าง Pool เพียงครั้งเดียวแล้วนำไปใช้ซ้ำทั่วทั้งแอปพลิเคชัน
let pool;
try {
  pool = new sql.ConnectionPool(dbConfig).connect();
  console.log("Connected to SQL Server");
} catch (error) {
  console.error("Database Connection Failed! Bad Config: ", error);
}

// ฟังก์ชันสำหรับส่ง query ไปยังฐานข้อมูล
// เราจะใช้ฟังก์ชันนี้ใน API routes ของเรา
export const query = async (text, params) => {
  const poolConnection = await pool;
  const request = poolConnection.request();

  // เพิ่ม parameters เข้าไปใน request เพื่อป้องกัน SQL Injection
  if (params) {
    for (const key in params) {
      request.input(key, params[key]);
    }
  }

  const result = await request.query(text);
  return result;
};
