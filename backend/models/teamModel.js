const { pool } = require("../config/db");

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT 
       t.id, 
       t.name, 
       t.description, 
       t.leader_id, 
       u.name AS leader_name, 
       u.email AS leader_email, 
       t.created_at, 
       t.updated_at,
       COALESCE(m.member_count, 0) AS member_count
     FROM teams t
     LEFT JOIN users u ON t.leader_id = u.id
     LEFT JOIN (
       SELECT team_id, COUNT(*) AS member_count 
       FROM users 
       WHERE team_id IS NOT NULL 
       GROUP BY team_id
     ) m ON t.id = m.team_id
     ORDER BY t.id DESC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT 
       t.id, 
       t.name, 
       t.description, 
       t.leader_id, 
       u.name AS leader_name, 
       u.email AS leader_email, 
       t.created_at, 
       t.updated_at
     FROM teams t
     LEFT JOIN users u ON t.leader_id = u.id
     WHERE t.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const team = rows[0];

  const [members] = await pool.execute(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE team_id = ?
     ORDER BY name ASC`,
    [id]
  );

  team.members = members;
  team.member_count = members.length;
  return team;
}

async function create({ name, description = null, leader_id = null }) {
  const [result] = await pool.execute(
    `INSERT INTO teams (name, description, leader_id)
     VALUES (?, ?, ?)`,
    [name, description, leader_id]
  );
  return findById(result.insertId);
}

async function update(id, { name, description, leader_id }) {
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name);
  }

  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description);
  }

  if (leader_id !== undefined) {
    updates.push("leader_id = ?");
    params.push(leader_id);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(
      `UPDATE teams SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  return findById(id);
}

async function assignMember(teamId, userId) {
  const [result] = await pool.execute(
    `UPDATE users SET team_id = ? WHERE id = ?`,
    [teamId, userId]
  );
  return result.affectedRows > 0;
}

async function removeMember(teamId, userId) {
  const [result] = await pool.execute(
    `UPDATE users SET team_id = NULL WHERE id = ? AND team_id = ?`,
    [userId, teamId]
  );
  return result.affectedRows > 0;
}

async function deleteById(id) {
  const [result] = await pool.execute(
    `DELETE FROM teams WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  assignMember,
  removeMember,
  deleteById,
};
