require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jsend = require("jsend");
const { testConnection } = require("./config/db");
const notfoundMiddleware = require("./middlewares/notfoundMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const taskRoutes = require("./routes/taskRoutes");
const extensionRoutes = require("./routes/extensionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json());
app.use(jsend.middleware);

// Base & Health check endpoints
app.get("/", function (request, response) {
  return response.status(200).jsend.success({
    message: "Task Management System API is running",
    data: {
      version: "1.0.0",
      status: "online",
    },
  });
});

app.get("/api/health", function (request, response) {
  return response.status(200).jsend.success({
    message: "Server is healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/extensions", extensionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 and Global Error Handling Middlewares
app.use(notfoundMiddleware);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async function () {
  console.log(`Server is running on port ${PORT} bound to 0.0.0.0`);
  await testConnection();
});
