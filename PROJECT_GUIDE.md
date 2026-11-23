# Advanced Task Management System for Teams - Project Guide

## 1. Project Overview & Architecture
- **Goal:** Full-stack role-based task management web application deployed on Railway.app.
- **Tech Stack:** React.js (Vite) + Redux Toolkit + Axios + SASS (Frontend), Node.js + Express 5 (Backend), MySQL 8 (Database).
- **Architecture Pattern:** Strictly follow the **Layered Architecture**:
  1. **Application Interface Layer:** `frontend/` (React UI, Redux Toolkit, Axios services).
  2. **Login, Forms & Role Management Layer:** `backend/routes/`, `backend/middlewares/` (`authMiddleware`, `roleMiddleware`, `schemaMiddleware`), `backend/validators/` (Joi).
  3. **Business Logic & Services Layer:** `backend/controllers/` and `backend/services/` (`notificationService.js`).
  4. **Data Access Layer:** `backend/models/` (SQL queries only using `mysql2/promise`).
  5. **Database Layer:** `backend/config/db.js` and `database/schema.sql` (MySQL).

## 2. Strict Global Rules
- **Source of Truth:** Always read `database/schema.sql` before writing any SQL query or API. Never invent table or column names.
- **Language & Comments:** All code, identifiers, and comments must be strictly in **English**. Keep comments short and meaningful.
- **No Email Service:** Do NOT install or use Nodemailer. All notifications are **In-App Notifications** stored in the `notifications` table.
- **File Uploads:** Store task attachments using `multer` with `memoryStorage` (max 5MB) directly in `task_attachments.file_data` (`LONGBLOB`) so files persist on Railway ephemeral containers.
- **Security:** Always use parameterized queries (`?`) in `mysql2`. Never expose password hashes in API responses.

## 3. Roles & Task Lifecycle
- **Roles:** `manager`, `team_leader`, `member`. Public registration always defaults to `member`. Managers assign roles and teams.
- **Task Statuses:** `Pending`, `In Progress`, `PendingReview`, `Completed`, `Delayed`.
  - Manager or Team Leader creates a task (`Pending`).
  - Member accepts task (`In Progress`), adds notes/attachments, or requests a deadline extension.
  - Member submits finished work (`PendingReview`), triggering a notification to the Team Leader.
  - Team Leader reviews work (quality rating 1-5 + review feedback):
    - Approved -> status becomes `Completed`.
    - Rejected -> status returns to `In Progress`.

## 4. Backend Coding Conventions (`backend/`)
- **Module System:** CommonJS (`require` / `module.exports`).
- **Entry Point:** `server.js`.
- **Naming:** `camelCase` filenames (e.g., `authRoutes.js`, `authControllers.js`, `userModel.js`, `authValidators.js`, `authMiddleware.js`).
- **Controller Functions:** Use standard `async function name(request, response)` declarations (no arrow functions for controllers) and full `(request, response)` parameter names.
- **Validation:** Use `joi` schemas inside `validators/` validated via `middlewares/schemaMiddleware.js` with `{ abortEarly: false }`.
- **Response Format:** Always use `jsend` middleware:
  - Success: `return response.status(CODE).jsend.success({ message: "...", data: ... });`
    - Note: `jsend.success(payload)` produces `{ status: "success", data: payload }`.
  - Error: `return response.status(CODE).jsend.error({ code: CODE, message: "..." });`
- **Database Connection (`config/db.js`):**
  - Support both Railway (`process.env.MYSQL_URL` or `MYSQLHOST`/`MYSQLPORT`/`MYSQLUSER`/`MYSQLPASSWORD`/`MYSQLDATABASE`) and local `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- **Railway Deployment Readiness:**
  - Use `const PORT = process.env.PORT || 3000;`.
  - Bind server to `"0.0.0.0"`: `app.listen(PORT, "0.0.0.0", ...)`.
  - Configure `cors` using `process.env.CORS_ORIGIN || "*"`.
  - Express 5 forwards rejected async controller errors to `errorMiddleware.js` automatically.

## 5. Backend Folder Structure
```text
backend/
├── config/
│   └── db.js
├── controllers/
├── middlewares/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   ├── schemaMiddleware.js
│   ├── notfoundMiddleware.js
│   └── errorMiddleware.js
├── models/
├── routes/
├── services/
│   └── notificationService.js
├── validators/
├── seed.js
├── server.js
├── .env.example
└── package.json