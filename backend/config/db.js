const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

if (process.env.MYSQL_URL) {
  pool = mysql.createPool(process.env.MYSQL_URL);
} else {
  pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || "root",
    password:
      process.env.MYSQLPASSWORD !== undefined
        ? process.env.MYSQLPASSWORD
        : process.env.DB_PASSWORD !== undefined
        ? process.env.DB_PASSWORD
        : "",
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "task_management",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

async function testConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection established successfully.");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
};
