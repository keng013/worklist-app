import sql from "mssql";
import { promises as fs } from "fs";
import path from "path";
import { decrypt } from "./crypto"; // 👈 Import Decrypt

// กำหนด path ไปยังไฟล์ config ของเรา
const configFilePath = path.join(process.cwd(), "db_config.json");

// สร้างตัวแปร Pool ไว้ข้างนอก
let pool; // This will hold the connected pool object

// This promise will resolve with the pool, or reject if connection fails.
// All query() calls will await this promise.
const poolConnect = (async () => {
  try {
    // 1. อ่านไฟล์ config.json
    let data;
    try {
      data = await fs.readFile(configFilePath, "utf8");
    } catch (readErr) {
      console.error(`❌ CRITICAL: Cannot read file: ${configFilePath}`);
      console.error("Did you run 'Save Settings' in the admin panel yet?");
      throw readErr;
    }

    const dbConfig = JSON.parse(data);

    // 2. ถอดรหัสผ่าน
    if (!dbConfig.db_pass || !dbConfig.db_pass.includes(":")) {
      throw new Error(
        "Database password in db_config.json is missing or not encrypted. Please re-save settings."
      );
    }

    const decryptedPassword = decrypt(dbConfig.db_pass);

    // 3. สร้าง Config สำหรับ mssql
    const config = {
      user: dbConfig.db_user,
      password: decryptedPassword, // 👈 ใช้รหัสผ่านที่ถอดรหัสแล้ว
      server: dbConfig.db_host,
      port: parseInt(dbConfig.db_port, 10),
      database: dbConfig.db_name,
      options: {
        encrypt: true, // ตั้งค่าเป็น false หาก SQL Server ไม่ได้ใช้ SSL
        trustServerCertificate: true, // ตั้งค่าเป็น true หากใช้ Self-signed certificate
      },
      pool: {
        max: 10, // จำนวน connection สูงสุดใน pool
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    // 4. สร้างและเชื่อมต่อ Pool
    // Assign the pool to the outer 'pool' variable *after* connection
    pool = new sql.ConnectionPool(config);
    await pool.connect(); // Wait for the connection

    console.log("✅ Database connection pool established successfully.");
    return pool; // Resolve the promise with the connected pool
  } catch (err) {
    console.error(
      "❌ CRITICAL: Failed to initialize database connection pool."
    );
    console.error(err.message);
    // Don't exit, just throw the error so poolConnect becomes a rejected promise
    throw err;
  }
})();

/**
 * ฟังก์ชันสำหรับ Query Database (ป้องกัน SQL Injection)
 * @param {string} sqlQuery - คำสั่ง SQL (เช่น "SELECT * FROM users WHERE id = @id")
 * @param {object} params - Parameters (เช่น { id: 1 })
 * @returns {Promise<sql.IResult<any>>}
 */
export async function query(sqlQuery, params = {}) {
  // 1. Wait for the pool promise to resolve.
  // If connection failed, this await will throw the initialization error.
  const connectedPool = await poolConnect;

  // 2. Use the resolved pool to create a request
  const request = connectedPool.request();

  // Add params to prevent SQL injection
  for (const key in params) {
    // (เราควรตรวจสอบประเภทข้อมูลของ params ที่นี่, แต่ mssql ค่อนข้างฉลาด)
    request.input(key, params[key]);
  }

  try {
    // 3. รัน Query
    const result = await request.query(sqlQuery);
    return result;
  } catch (err) {
    console.error("SQL Query Error:", err.message);
    console.error("Query:", sqlQuery);
    console.error("Params:", params);
    throw err; // โยน Error กลับไปให้ API route จัดการ
  }
}
