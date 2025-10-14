// generate_hashes.js
// ใช้สำหรับสร้าง password hash เพื่อนำไปใส่ในฐานข้อมูล
// วิธีรัน: node generate_hashes.js

const bcrypt = require("bcryptjs");

const saltRounds = 10; // ค่ามาตรฐานสำหรับ bcrypt

const usersToCreate = [
  { username: "admin", password: "md@admin" },
  { username: "it", password: "it@123" },
];

console.log("--- Generating Password Hashes ---");

usersToCreate.forEach((user) => {
  const hash = bcrypt.hashSync(user.password, saltRounds);
  console.log(`\nUsername: ${user.username}`);
  console.log(`Password: ${user.password}`);
  console.log(`Hashed Password (copy this value): ${hash}`);
  console.log(`\n-- SQL INSERT Statement --`);
  console.log(
    `INSERT INTO wkl_users (username, password_hash) VALUES ('${user.username}', '${hash}');`
  );
});

console.log("\n------------------------------------");
console.log(
  "Copy the generated SQL INSERT statements and run them in your database."
);
