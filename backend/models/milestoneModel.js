const { pool } = require("../config/db");

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT 
       m.id, 
       m.title, 
       m.description, 
       m.due_date, 
       m.created_by, 
       u.name AS creator_name,
       m.created_at, 
       m.updated_at,
       COALESCE(tc.total_tasks, 0) AS total_tasks,
       COALESCE(tc.completed_tasks, 0) AS completed_tasks
     FROM milestones m
     LEFT JOIN users u ON m.created_by = u.id
     LEFT JOIN (
       SELECT 
         milestone_id, 
         COUNT(*) AS total_tasks,
         SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
       FROM tasks
       WHERE milestone_id IS NOT NULL
       GROUP BY milestone_id
     ) tc ON m.id = tc.milestone_id
     ORDER BY m.id DESC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT 
       m.id, 
       m.title, 
       m.description, 
       m.due_date, 
       m.created_by, 
       u.name AS creator_name,
       m.created_at, 
       m.updated_at
     FROM milestones m
     LEFT JOIN users u ON m.created_by = u.id
     WHERE m.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function create({ title, description = null, due_date = null, created_by = null }) {
  const [result] = await pool.execute(
    `INSERT INTO milestones (title, description, due_date, created_by)
     VALUES (?, ?, ?, ?)`,
    [title, description, due_date, created_by]
  );
  return findById(result.insertId);
}

async function update(id, { title, description, due_date }) {
  const updates = [];
  const params = [];

  if (title !== undefined) {
    updates.push("title = ?");
    params.push(title);
  }

  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description);
  }

  if (due_date !== undefined) {
    updates.push("due_date = ?");
    params.push(due_date);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(
      `UPDATE milestones SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  return findById(id);
}

async function deleteById(id) {
  const [result] = await pool.execute(
    `DELETE FROM milestones WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById,
};
