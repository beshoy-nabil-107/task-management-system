# Task Management System - Backend API Reference

This document provides a complete specification for all available backend REST endpoints.
All API responses follow the **JSend** standard format:
- **Success (`2xx`)**: `{ "status": "success", "data": { "message": "...", ... } }`
- **Error (`4xx`/`5xx`)**: `{ "status": "error", "code": CODE, "message": "..." }`

---

## 1. Authentication & Profile (`/api/auth`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new member account | `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }` | `{ "message": "...", "data": { "token": "...", "user": { "id": 1, "name": "...", "email": "...", "role": "member", ... } } }` |
| `POST` | `/api/auth/login` | Public | Authenticates user & returns JWT | `{ "email": "john@example.com", "password": "password123" }` | `{ "message": "...", "data": { "token": "...", "user": { "id": 1, "name": "...", "email": "...", "role": "...", "team_id": ..., "team_name": ... } } }` |
| `GET` | `/api/auth/me` | Authenticated | Gets currently logged-in user profile | *None* (Header: `Authorization: Bearer <token>`) | Current user object (excluding password hash) |
| `PUT` | `/api/auth/me` | Authenticated | Updates name and/or password | `{ "name"?: "New Name", "password"?: "newPassword123" }` | Updated user object |

---

## 2. In-App Notifications (`/api/notifications`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Gets user's notifications (latest 50) and unread count | *None* | `{ "notifications": [ ... ], "unreadCount": 3 }` |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Marks all unread notifications as read | *None* | `{ "updatedCount": 3 }` |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Marks a specific notification as read | Param: `:id` | `null` |

---

## 3. Users Management (`/api/users`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | `manager`, `team_leader` | Managers get all users; Leaders get users in their team | *None* | `{ "users": [ { "id": 1, "name": "...", "email": "...", "role": "...", "team_id": ..., "team_name": ... } ] }` |
| `PATCH` | `/api/users/:id/role` | `manager` | Updates a user's role and/or team | Param: `:id`<br>Body: `{ "role": "team_leader", "team_id": 2 }` | `{ "user": { ... } }` |
| `DELETE` | `/api/users/:id` | `manager` | Deletes a user (cannot delete own account) | Param: `:id` | `null` |

---

## 4. Teams Management (`/api/teams`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/teams` | Authenticated | Managers see all teams; Leaders/Members see their assigned team | *None* | `{ "teams": [ { "id": 1, "name": "...", "description": "...", "leader_id": ..., "leader_name": "...", "member_count": 5 } ] }` |
| `GET` | `/api/teams/:id` | Authenticated | Gets team details and members list (Managers: any; Leaders/Members: own team only) | Param: `:id` | `{ "team": { "id": 1, "name": "...", "members": [ ... ], "member_count": 5 } }` |
| `POST` | `/api/teams` | `manager` | Creates a new team & syncs leader role/team | `{ "name": "Frontend Team", "description": "...", "leader_id": 2 }` | `{ "team": { ... } }` |
| `PUT` | `/api/teams/:id` | `manager` | Updates team details and syncs leader | Param: `:id`<br>Body: `{ "name": "...", "description": "...", "leader_id": ... }` | `{ "team": { ... } }` |
| `POST` | `/api/teams/:id/members` | `manager` | Assigns a member to the team | Param: `:id`<br>Body: `{ "user_id": 4 }` | `{ "team": { ... } }` |
| `DELETE` | `/api/teams/:id/members/:userId` | `manager` | Removes a member from the team | Params: `:id`, `:userId` | `{ "team": { ... } }` |
| `DELETE` | `/api/teams/:id` | `manager` | Deletes a team | Param: `:id` | `null` |

---

## 5. Milestones (`/api/milestones`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/milestones` | Authenticated | Lists all milestones with task counts | *None* | `{ "milestones": [ { "id": 1, "title": "...", "due_date": "YYYY-MM-DD", "total_tasks": 10, "completed_tasks": 6 } ] }` |
| `GET` | `/api/milestones/:id` | Authenticated | Gets single milestone details | Param: `:id` | `{ "milestone": { ... } }` |
| `POST` | `/api/milestones` | `manager` | Creates a new milestone | `{ "title": "Sprint 1", "description": "...", "due_date": "2026-12-31" }` | `{ "milestone": { ... } }` |
| `PUT` | `/api/milestones/:id` | `manager` | Updates milestone details | Param: `:id`<br>Body: `{ "title": "...", "description": "...", "due_date": "..." }` | `{ "milestone": { ... } }` |
| `DELETE` | `/api/milestones/:id` | `manager` | Deletes a milestone | Param: `:id` | `null` |

---

## 6. Tasks, Attachments & Reviews (`/api/tasks`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Authenticated | Role-scoped tasks query (Managers: all with filters; Leaders: own team; Members: assigned to them) | Query params: `status`, `priority`, `team_id`, `assigned_to`, `milestone_id` | `{ "tasks": [ { "id": 1, "title": "...", "status": "Pending", "priority": "Medium", "deadline": "YYYY-MM-DD", "team_name": "...", "assignee_name": "..." } ] }` |
| `GET` | `/api/tasks/:id` | Authenticated (scoped) | Gets task details, attachments list, and extension requests | Param: `:id` | `{ "task": { ... }, "attachments": [ ... ], "extensions": [ ... ] }` |
| `POST` | `/api/tasks` | `manager`, `team_leader` | Creates a new task (Leaders locked to own team and team members) | `{ "title": "Implement Auth", "description": "...", "priority": "High", "deadline": "2026-12-15", "team_id": 1, "assigned_to": 3, "milestone_id": 1 }` | `{ "task": { ... } }` |
| `PUT` | `/api/tasks/:id` | `manager`, `team_leader` | Updates task details (Leaders locked to own team) | Param: `:id`<br>Body: (same fields as creation, all optional) | `{ "task": { ... } }` |
| `DELETE` | `/api/tasks/:id` | `manager`, `team_leader` | Deletes task (Leaders locked to own team) | Param: `:id` | `null` |
| `PATCH` | `/api/tasks/:id/status` | Authenticated (scoped) | Updates task status (Members submitting `Completed` or `PendingReview` are set to `PendingReview` and notify leaders) | Param: `:id`<br>Body: `{ "status": "In Progress" }` | `{ "task": { ... } }` |
| `POST` | `/api/tasks/:id/review` | `manager`, `team_leader` | Reviews submitted work (`approve` sets `Completed` + rating 1-5; `reject` returns to `In Progress` + feedback) | Param: `:id`<br>Body: `{ "decision": "approve", "quality_rating": 5, "review_feedback": "Great work" }` | `{ "task": { ... } }` |
| `POST` | `/api/tasks/:id/attachments` | Authenticated (scoped) | Adds note and/or file attachment (max 5MB, `multipart/form-data`) | Form-Data: `note` (text, optional), `file` (binary, optional) | `{ "attachment": { "id": 1, "task_id": 1, "note": "...", "file_name": "...", "file_size": 1024, ... } }` |
| `GET` | `/api/tasks/:id/attachments/:attachmentId/download` | Authenticated (scoped) | Downloads binary file attachment | Params: `:id`, `:attachmentId` | Binary file stream with `Content-Disposition` header |

---

## 7. Deadline Extensions (`/api/extensions`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/extensions` | Authenticated | Role-scoped requests (Manager: all; Leader: own team; Member: own requests) | Query params: `team_id`, `task_id`, `user_id` | `{ "extensions": [ { "id": 1, "task_id": 1, "task_title": "...", "current_deadline": "...", "requested_deadline": "...", "reason": "...", "status": "Pending", "requester_name": "..." } ] }` |
| `POST` | `/api/extensions` | `member`, `team_leader` | Requests deadline extension for assigned task | `{ "task_id": 1, "requested_deadline": "2026-12-25", "reason": "Awaiting third party API access" }` | `{ "extension": { ... } }` |
| `PATCH` | `/api/extensions/:id` | `manager`, `team_leader` | Approves or rejects request (Approval updates `tasks.deadline` and resets `Delayed` tasks to `In Progress`) | Param: `:id`<br>Body: `{ "status": "Approved" }` or `{ "status": "Rejected" }` | `{ "extension": { ... } }` |

---

## 8. Performance Reports & Team Feedback (`/api/reports`)

| Method | Endpoint | Allowed Roles | Description | Request Body / Query | Success Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/overview` | `manager`, `team_leader` | Task status counts & percentages for dashboard charts | Query param (optional): `team_id` | `{ "overview": { "total_tasks": 20, "pending_tasks": 4, "in_progress_tasks": 6, "pending_review_tasks": 2, "completed_tasks": 7, "delayed_tasks": 1, "percentages": { "completed": 35.0, ... } } }` |
| `GET` | `/api/reports/performance` | `manager` | Full team productivity metrics, most productive team, and submitted leader reports | *None* | `{ "teams": [ { "team_id": 1, "team_name": "...", "leader_name": "...", "total_tasks": 10, "completion_rate": 70.0, "avg_quality_rating": 4.5 } ], "averageProductivity": 65.5, "mostProductiveTeam": { ... }, "teamReports": [ ... ] }` |
| `GET` | `/api/reports/team-feedback` | `manager`, `team_leader` | Lists qualitative team feedback submitted by team leaders | Query param (optional): `team_id` | `{ "reports": [ { "id": 1, "team_id": 1, "team_name": "...", "leader_name": "...", "feedback": "...", "created_at": "..." } ] }` |
| `POST` | `/api/reports/team-feedback` | `team_leader` | Submits monthly/weekly team performance report for leader's assigned team | `{ "feedback": "Sprint completed successfully with all high-priority tasks delivered." }` | `{ "report": { ... } }` |
