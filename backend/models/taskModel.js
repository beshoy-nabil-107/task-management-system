const { pool } = require("../config/db");

async function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.status) {
    conditions.push("t.status = ?");
    params.push(filters.status);
  }

  if (filters.priority) {
    conditions.push("t.priority = ?");
    params.push(filters.priority);
  }

  if (filters.team_id !== undefined && filters.team_id !== null) {
    conditions.push("t.team_id = ?");
    params.push(filters.team_id);
  }

  if (filters.assigned_to !== undefined && filters.assigned_to !== null) {
    conditions.push("t.assigned_to = ?");
    params.push(filters.assigned_to);
  }

  if (filters.milestone_id !== undefined && filters.milestone_id !== null) {
    conditions.push("t.milestone_id = ?");
    params.push(filters.milestone_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      t.id,
      t.title,
      t.description,
      t.priority,
      t.status,
      DATE_FORMAT(t.deadline, '%Y-%m-%d') AS deadline,
      t.team_id,
      tm.name AS team_name,
      t.assigned_to,
      ua.name AS assignee_name,
      ua.email AS assignee_email,
      t.created_by,
      uc.name AS creator_name,
      t.milestone_id,
      m.title AS milestone_title,
      t.quality_rating,
      t.review_feedback,
      t.reviewed_by,
      ur.name AS reviewer_name,
      t.reviewed_at,
      t.created_at,
      t.updated_at
    FROM tasks t
    LEFT JOIN teams tm ON t.team_id = tm.id
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    LEFT JOIN users ur ON t.reviewed_by = ur.id
    LEFT JOIN milestones m ON t.milestone_id = m.id
    ${whereClause}
    ORDER BY t.id DESC
  `;

  const [rows] = await pool.execute(query, params);
  return rows;
}

async function findById(id) {
  const query = `
    SELECT 
      t.id,
      t.title,
      t.description,
      t.priority,
      t.status,
      DATE_FORMAT(t.deadline, '%Y-%m-%d') AS deadline,
      t.team_id,
      tm.name AS team_name,
      t.assigned_to,
      ua.name AS assignee_name,
      ua.email AS assignee_email,
      t.created_by,
      uc.name AS creator_name,
      t.milestone_id,
      m.title AS milestone_title,
      t.quality_rating,
      t.review_feedback,
      t.reviewed_by,
      ur.name AS reviewer_name,
      t.reviewed_at,
      t.created_at,
      t.updated_at
    FROM tasks t
    LEFT JOIN teams tm ON t.team_id = tm.id
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    LEFT JOIN users ur ON t.reviewed_by = ur.id
    LEFT JOIN milestones m ON t.milestone_id = m.id
    WHERE t.id = ?
  `;

  const [rows] = await pool.execute(query, [id]);
  return rows.length > 0 ? rows[0] : null;
}

async function create({
  title,
  description = null,
  priority = "Medium",
  deadline,
  team_id = null,
  assigned_to = null,
  created_by = null,
  milestone_id = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO tasks (title, description, priority, deadline, team_id, assigned_to, created_by, milestone_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, priority, deadline, team_id, assigned_to, created_by, milestone_id]
  );
  return findById(result.insertId);
}

async function update(id, fields = {}) {
  const allowed = ["title", "description", "priority", "deadline", "team_id", "assigned_to", "milestone_id"];
  const updates = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  return findById(id);
}

async function updateStatus(id, status) {
  await pool.execute(
    `UPDATE tasks SET status = ? WHERE id = ?`,
    [status, id]
  );
  return findById(id);
}

async function submitReview(id, { status, quality_rating = null, review_feedback = null, reviewed_by = null }) {
  await pool.execute(
    `UPDATE tasks
     SET status = ?, quality_rating = ?, review_feedback = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [status, quality_rating, review_feedback, reviewed_by, id]
  );
  return findById(id);
}

async function deleteById(id) {
  const [result] = await pool.execute(
    `DELETE FROM tasks WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateStatus,
  submitReview,
  deleteById,
};
