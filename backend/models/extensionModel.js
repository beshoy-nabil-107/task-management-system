const { pool } = require("../config/db");

async function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.team_id !== undefined && filters.team_id !== null) {
    conditions.push("t.team_id = ?");
    params.push(filters.team_id);
  }

  if (filters.user_id !== undefined && filters.user_id !== null) {
    conditions.push("e.user_id = ?");
    params.push(filters.user_id);
  }

  if (filters.task_id !== undefined && filters.task_id !== null) {
    conditions.push("e.task_id = ?");
    params.push(filters.task_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      e.id,
      e.task_id,
      t.title AS task_title,
      DATE_FORMAT(t.deadline, '%Y-%m-%d') AS current_deadline,
      t.team_id,
      tm.name AS team_name,
      e.user_id,
      u.name AS requester_name,
      u.email AS requester_email,
      DATE_FORMAT(e.requested_deadline, '%Y-%m-%d') AS requested_deadline,
      e.reason,
      e.status,
      e.reviewed_by,
      ur.name AS reviewer_name,
      e.created_at,
      e.updated_at
    FROM extension_requests e
    JOIN tasks t ON e.task_id = t.id
    LEFT JOIN teams tm ON t.team_id = tm.id
    JOIN users u ON e.user_id = u.id
    LEFT JOIN users ur ON e.reviewed_by = ur.id
    ${whereClause}
    ORDER BY e.id DESC
  `;

  const [rows] = await pool.execute(query, params);
  return rows;
}

async function findById(id) {
  const query = `
    SELECT 
      e.id,
      e.task_id,
      t.title AS task_title,
      t.assigned_to,
      DATE_FORMAT(t.deadline, '%Y-%m-%d') AS current_deadline,
      t.team_id,
      t.status AS task_status,
      e.user_id,
      u.name AS requester_name,
      u.email AS requester_email,
      DATE_FORMAT(e.requested_deadline, '%Y-%m-%d') AS requested_deadline,
      e.reason,
      e.status,
      e.reviewed_by,
      ur.name AS reviewer_name,
      e.created_at,
      e.updated_at
    FROM extension_requests e
    JOIN tasks t ON e.task_id = t.id
    JOIN users u ON e.user_id = u.id
    LEFT JOIN users ur ON e.reviewed_by = ur.id
    WHERE e.id = ?
  `;

  const [rows] = await pool.execute(query, [id]);
  return rows.length > 0 ? rows[0] : null;
}

async function create({ task_id, user_id, requested_deadline, reason }) {
  const [result] = await pool.execute(
    `INSERT INTO extension_requests (task_id, user_id, requested_deadline, reason, status)
     VALUES (?, ?, ?, ?, 'Pending')`,
    [task_id, user_id, requested_deadline, reason]
  );
  return findById(result.insertId);
}

async function updateStatus(id, { status, reviewed_by }) {
  await pool.execute(
    `UPDATE extension_requests
     SET status = ?, reviewed_by = ?
     WHERE id = ?`,
    [status, reviewed_by, id]
  );
  return findById(id);
}

module.exports = {
  findAll,
  findById,
  create,
  updateStatus,
};
