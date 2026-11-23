const { pool } = require("../config/db");

async function create({ user_id, type = "GENERAL", message, related_task_id = null }) {
  const [result] = await pool.execute(
    `INSERT INTO notifications (user_id, type, message, related_task_id)
     VALUES (?, ?, ?, ?)`,
    [user_id, type, message, related_task_id]
  );
  return {
    id: result.insertId,
    user_id,
    type,
    message,
    related_task_id,
    is_read: 0,
    created_at: new Date(),
  };
}

async function createMany(notificationsArray) {
  if (!notificationsArray || notificationsArray.length === 0) {
    return [];
  }

  const values = [];
  const placeholders = [];

  for (const n of notificationsArray) {
    placeholders.push("(?, ?, ?, ?)");
    values.push(n.user_id, n.type || "GENERAL", n.message, n.related_task_id || null);
  }

  const query = `
    INSERT INTO notifications (user_id, type, message, related_task_id)
    VALUES ${placeholders.join(", ")}
  `;

  await pool.execute(query, values);
  return notificationsArray;
}

async function findByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, type, message, related_task_id, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows;
}

async function countUnreadByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS unread_count
     FROM notifications
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return Number(rows[0].unread_count) || 0;
}

async function markAsRead(id, userId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function markAllAsRead(userId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return result.affectedRows;
}

module.exports = {
  create,
  createMany,
  findByUserId,
  countUnreadByUserId,
  markAsRead,
  markAllAsRead,
};
