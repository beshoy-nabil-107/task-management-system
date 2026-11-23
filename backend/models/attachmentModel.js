const { pool } = require("../config/db");

async function findByTaskId(taskId) {
  const [rows] = await pool.execute(
    `SELECT 
       a.id, 
       a.task_id, 
       a.user_id, 
       a.note, 
       a.file_name, 
       a.file_type, 
       a.file_size, 
       a.created_at, 
       u.name AS author_name
     FROM task_attachments a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.task_id = ?
     ORDER BY a.created_at ASC`,
    [taskId]
  );
  return rows;
}

async function findFileById(id, taskId) {
  const [rows] = await pool.execute(
    `SELECT id, task_id, file_name, file_type, file_size, file_data
     FROM task_attachments
     WHERE id = ? AND task_id = ?`,
    [id, taskId]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function create({
  task_id,
  user_id = null,
  note = null,
  file_name = null,
  file_type = null,
  file_size = null,
  file_data = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO task_attachments (task_id, user_id, note, file_name, file_type, file_size, file_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [task_id, user_id, note, file_name, file_type, file_size, file_data]
  );

  const [rows] = await pool.execute(
    `SELECT 
       a.id, 
       a.task_id, 
       a.user_id, 
       a.note, 
       a.file_name, 
       a.file_type, 
       a.file_size, 
       a.created_at, 
       u.name AS author_name
     FROM task_attachments a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.id = ?`,
    [result.insertId]
  );

  return rows.length > 0 ? rows[0] : null;
}

module.exports = {
  findByTaskId,
  findFileById,
  create,
};
