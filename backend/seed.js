require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");
const userModel = require("./models/userModel");

async function seed() {
  try {
    console.log("Starting database seed process...");

    const managerEmail = "manager@taskflow.com";
    const existingManager = await userModel.findByEmail(managerEmail);

    if (existingManager) {
      console.log(`Default manager account already exists (${managerEmail}). No action needed.`);
    } else {
      const hashedPassword = await bcrypt.hash("Manager123!", 10);
      const newManager = await userModel.create({
        name: "System Manager",
        email: managerEmail,
        password: hashedPassword,
        role: "manager",
      });
      console.log(`Default manager account created successfully: ${newManager.email} (ID: ${newManager.id})`);
    }

    console.log("Database seed process completed successfully.");
  } catch (error) {
    console.error("Database seed failed with error:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
      console.log("Database connection pool closed.");
    } catch (poolError) {
      console.error("Error closing connection pool:", poolError.message);
    }
  }
}

seed();
