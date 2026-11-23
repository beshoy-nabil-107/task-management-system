# TaskFlow — Advanced Task Management System for Teams

A full-stack, role-based task management web application built with React, Node.js (Express 5), and MySQL 8, following a strict Layered Architecture and deployed to the cloud on Railway.app.

---

## Live Deployment & Repository

| Resource | URL |
| :--- | :--- |
| **Live Web Application (Frontend)** | [https://frontend-production-a80a559b.up.railway.app/](https://frontend-production-a80a559b.up.railway.app/) |
| **Live REST API (Backend)** | [https://backend-production-623e3037.up.railway.app/api](https://backend-production-623e3037.up.railway.app/api) |
| **API Health Check** | [https://backend-production-623e3037.up.railway.app/api/health](https://backend-production-623e3037.up.railway.app/api/health) |
| **GitHub Repository** | [https://github.com/beshoy-nabil-107/task-management-system.git](https://github.com/beshoy-nabil-107/task-management-system.git) |

### Default Seeded Manager Credentials

To test administrative features on the live deployment or after running the local seed script:

- **Email:** `manager@taskflow.com`
- **Password:** `Manager123!`
- **Role:** `manager`

*(Public registration via `/register` automatically assigns the `member` role. Managers can promote users to `team_leader` or assign them to teams.)*

---

## System Architecture

The application strictly implements a five-layer **Layered Architecture** to maintain clear separation of concerns, testability, and maintainability:

1. **Application Interface Layer (`frontend/`):** Single-Page Application (SPA) built with React, Redux Toolkit for centralized state management, Axios interceptors for authenticated HTTP communication, Recharts for analytics, and modular SASS stylesheets.
2. **Routing, Validation & Role Management Layer (`backend/routes/`, `backend/middlewares/`, `backend/validators/`):** Handles HTTP routing, JWT authentication (`authMiddleware`), Role-Based Access Control (`roleMiddleware`), Joi request payload validation (`schemaMiddleware`), and centralized Express 5 error handling (`errorMiddleware`).
3. **Business Logic & Services Layer (`backend/controllers/`, `backend/services/`):** Enforces workflow transitions, quality review rules, deadline extension logic, and in-app notification dispatching (`notificationService`).
4. **Data Access Layer (`backend/models/`):** Encapsulates parameterized SQL queries using `mysql2/promise` connection pooling with strict compliance to MySQL 8 `ONLY_FULL_GROUP_BY` mode.
5. **Database Layer (`backend/config/db.js`, `database/schema.sql`):** Relational MySQL 8 database schema with foreign key constraints and persistent `LONGBLOB` attachment storage.

---

## Technology Stack

### Frontend
- **Framework & Build Tool:** React 18, Vite
- **State Management:** Redux Toolkit (`createSlice`, `createAsyncThunk`), React-Redux
- **Routing & HTTP:** React Router DOM v7, Axios
- **Styling & UI:** Modular SASS (minimalist light enterprise interface), Lucide React
- **Data Visualization:** Recharts (Pie Chart and Bar Chart)
- **Production Static Server:** `serve` (configured with SPA fallback routing)

### Backend
- **Runtime & Framework:** Node.js, Express 5 (CommonJS)
- **Database Driver:** `mysql2/promise` (Connection Pool)
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cors`
- **Validation & Response Standard:** `joi`, `jsend`
- **File Uploads:** `multer` (`memoryStorage`, 5 MB file size limit stored directly in MySQL `LONGBLOB`)

### Infrastructure
- **Cloud Platform:** Railway.app (three isolated services: MySQL 8, Backend API, and Frontend SPA)

---

## Core Features & Role-Based Access Control (RBAC)

### 1. Roles & Permissions
- **Manager (`manager`):** Full system oversight; manages users and roles, creates and edits teams, assigns team leaders and members, manages project milestones, creates/edits/reviews tasks, approves or rejects deadline extensions, and monitors organization-wide performance reports.
- **Team Leader (`team_leader`):** Scoped to their assigned team; views team members (including member IDs and names), creates and assigns tasks within the team, reviews submitted work quality, approves/rejects team deadline extension requests, and submits team performance feedback reports to management.
- **Team Member (`member`):** Views assigned tasks and upcoming deadlines, accepts assigned tasks, posts progress notes and file attachments, submits deadline extension requests, submits completed work for quality review, and tracks personal request outcomes and notifications.

### 2. Task Lifecycle & Work Quality Review
- Tasks progress through structured states: `Pending` -> `In Progress` -> `PendingReview` -> `Completed` (or `Delayed`).
- Members accept `Pending` tasks to begin work (`In Progress`) and cannot self-approve completion; submitting finished work transitions the task to `PendingReview` and notifies the Team Leader.
- Team Leaders and Managers perform a **Work Quality Review** combining a numeric rating (1 to 5) and textual review feedback:
  - **Approve:** Transitions status to `Completed` and locks member status modifications.
  - **Reject:** Returns status to `In Progress` and displays the review feedback to the assigned member for rework.

### 3. Notes, Persistent File Attachments & Deadline Extensions
- Users with task access can attach progress notes and upload files (up to 5 MB) stored in MySQL `LONGBLOB` columns to guarantee persistence across ephemeral cloud containers.
- File downloads are authenticated via Axios `blob` requests with JWT Bearer headers; list queries omit binary payloads for optimal API performance.
- Assigned members working on `In Progress` or `Delayed` tasks can submit deadline extension requests specifying a later target date and justification. Approving a request automatically updates the task deadline in the database (and resets `Delayed` tasks back to `In Progress`).

### 4. In-App Notifications & Performance Analytics
- Real-time polling notification center tracks key workflow events (task assignment, submission, approval/rejection, extension requests/decisions, role/team updates, and team reports).
- **Dashboard & Reports:** Provides role-adaptive KPI cards, a task status distribution Pie Chart, a team completion comparison Bar Chart, average organizational productivity metrics, automatic identification of the **Most Productive Team**, and a Team Leader feedback log.

---

## Database Schema Overview

The relational schema defined in `database/schema.sql` consists of 8 tables:

| Table | Purpose |
| :--- | :--- |
| `users` | Stores user accounts, hashed passwords, assigned role, and team reference. |
| `teams` | Stores team metadata and references the assigned `leader_id`. |
| `milestones` | Tracks high-level project milestones and target due dates. |
| `tasks` | Stores task details, priority, status, deadline, assignments, milestone link, and quality review fields. |
| `task_attachments` | Stores task notes, file metadata, and binary file payloads (`LONGBLOB`). |
| `extension_requests` | Tracks deadline extension proposals, justifications, approval statuses, and reviewers. |
| `team_reports` | Stores periodic team performance feedback submitted by Team Leaders to Managers. |
| `notifications` | Persists in-app user notifications, read states, and optional links to related tasks. |

---

## Project Structure

```text
task-management-system/
├── database/
│   └── schema.sql               # MySQL 8 database schema (8 tables)
├── backend/
│   ├── config/
│   │   └── db.js                # MySQL connection pool (supports MYSQL_URL & local env vars)
│   ├── controllers/             # Request handlers following jsend response format
│   ├── middlewares/             # auth, role, Joi schema, 404, and Express 5 error handlers
│   ├── models/                  # Parameterized SQL data access layer
│   ├── routes/                  # Express route definitions
│   ├── services/                # In-app notification service
│   ├── validators/              # Joi validation schemas
│   ├── API_ENDPOINTS.md         # Detailed REST API endpoint reference
│   ├── seed.js                  # Initial Manager account seeding script
│   ├── server.js                # Express application entry point
│   ├── .env.example             # Backend environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/              # Centralized icon registry
│   │   ├── components/          # AppLayout, ProtectedRoute, ErrorBoundary, reusable UI primitives
│   │   ├── pages/               # Dashboard, Login, Register, Profile, Users, Teams, Milestones, Tasks, TaskDetails, Extensions, Reports
│   │   ├── services/            # Centralized Axios instance and module API services
│   │   ├── store/               # Redux Toolkit store and slices
│   │   ├── styles/              # SASS variables, mixins, and global styles
│   │   ├── utils/               # Date and file-size formatting helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example             # Frontend environment template
│   └── package.json
├── PROJECT_GUIDE.md             # Architectural and coding conventions guide
└── README.md
```

---

## REST API Overview

All API responses follow the **JSend** specification (`status: "success"` or `status: "error"`). Protected routes require an `Authorization: Bearer <token>` header.

| Module | Base Path | Key Capabilities |
| :--- | :--- | :--- |
| **Health** | `/api/health` | Service availability verification. |
| **Auth** | `/api/auth` | User registration, login, profile retrieval (`GET /me`), and profile update (`PUT /me`). |
| **Users** | `/api/users` | Role-scoped user listing, role/team assignment (`PATCH /:id/role`), and account deletion. |
| **Teams** | `/api/teams` | Team CRUD, leader synchronization, and member assignment/removal. |
| **Milestones** | `/api/milestones` | Project milestone CRUD with aggregated task completion metrics. |
| **Tasks** | `/api/tasks` | Role-scoped task CRUD, status workflow transitions, quality review (`POST /:id/review`), and attachment upload/download. |
| **Extensions** | `/api/extensions` | Extension request submission and approval/rejection with automatic deadline updates. |
| **Reports** | `/api/reports` | Task status overview, multi-team performance analytics, and team leader feedback submission. |
| **Notifications** | `/api/notifications` | Fetch user notifications with unread count, mark single/all as read. |

For complete request schemas and role restrictions, refer to `backend/API_ENDPOINTS.md`.

---

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MySQL 8.0+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/beshoy-nabil-107/task-management-system.git
cd task-management-system
```

### 2. Configure the Database
1. Create a local MySQL database (e.g., `task_management`).
2. Execute `database/schema.sql` against the database using MySQL Workbench or the MySQL CLI.

### 3. Configure and Run the Backend
```bash
cd backend
npm install
```

Create a `backend/.env` file based on `backend/.env.example`:
```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_local_jwt_secret
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_management
```

Seed the initial Manager account and start the development server:
```bash
npm run seed
npm run dev
```
The API will be available at `http://localhost:3000`.

### 4. Configure and Run the Frontend
Open a second terminal from the repository root:
```bash
cd frontend
npm install
```

Create a `frontend/.env` file based on `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:3000/api
```

Start the Vite development server:
```bash
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

---

## Cloud Deployment Architecture (Railway.app)

The system is deployed on Railway.app as three decoupled services within a single project:

1. **MySQL Service:** Hosts the MySQL 8 database initialized with `database/schema.sql` and seeded with the default Manager account.
2. **Backend Service (`/backend`):**
   - Connects internally to MySQL using Railway private networking (`MYSQL_URL=${{MySQL.MYSQL_URL}}`).
   - Binds to `0.0.0.0` on `process.env.PORT`.
   - Restricts cross-origin requests via `CORS_ORIGIN` pinned strictly to the production frontend domain.
3. **Frontend Service (`/frontend`):**
   - Configured with `VITE_API_URL` pointing to the production backend `/api` endpoint prior to build time.
   - Built via `vite build` and served in production with `serve -s dist -l $PORT` to support client-side SPA routing on page refreshes.