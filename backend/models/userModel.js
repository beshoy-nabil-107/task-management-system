const { pool } = require("../config/db");

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.password, u.role, u.team_id, t.name AS team_name, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN teams t ON u.team_id = t.id
     WHERE u.email = ?`,
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.team_id, t.name AS team_name, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN teams t ON u.team_id = t.id
     WHERE u.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.team_id, t.name AS team_name, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN teams t ON u.team_id = t.id
     ORDER BY u.id DESC`
  );
  return rows;
}

async function findByTeamId(teamId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.team_id, t.name AS team_name, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN teams t ON u.team_id = t.id
     WHERE u.team_id = ?
     ORDER BY u.id DESC`,
    [teamId]
  );
  return rows;
}

async function findManagers() {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role
     FROM users
     WHERE role = 'manager'`
  );
  return rows;
}

async function create({ name, email, password, role = "member" }) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, password, role]
  );
  return findById(result.insertId);
}

async function updateProfile(id, { name, password }) {
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name);
  }

  if (password !== undefined) {
    updates.push("password = ?");
    params.push(password);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  return findById(id);
}

async function updateRoleAndTeam(id, { role, team_id }) {
  const updates = [];
  const params = [];

  if (role !== undefined) {
    updates.push("role = ?");
    params.push(role);
  }

  if (team_id !== undefined) {
    updates.push("team_id = ?");
    params.push(team_id);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  return findById(id);
}

async function deleteById(id) {
  const [result] = await pool.execute(
    `DELETE FROM users WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findByEmail,
  findById,
  findAll,
  findByTeamId,
  findManagers,
  create,
  updateProfile,
  updateRoleAndTeam,
  deleteById,
};
