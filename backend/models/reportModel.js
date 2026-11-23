const { pool } = require("../config/db");

async function getStatusOverview(teamId = null) {
  const params = [];
  let where = "";
  if (teamId !== null && teamId !== undefined) {
    where = "WHERE team_id = ?";
    params.push(teamId);
  }

  const query = `
    SELECT 
      COUNT(*) AS total_tasks,
      COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pending_tasks,
      COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS in_progress_tasks,
      COALESCE(SUM(CASE WHEN status = 'PendingReview' THEN 1 ELSE 0 END), 0) AS pending_review_tasks,
      COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed_tasks,
      COALESCE(SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END), 0) AS delayed_tasks
    FROM tasks
    ${where}
  `;

  const [rows] = await pool.execute(query, params);
  const row = rows[0];
  const total = Number(row.total_tasks) || 0;
  const pending = Number(row.pending_tasks) || 0;
  const inProgress = Number(row.in_progress_tasks) || 0;
  const pendingReview = Number(row.pending_review_tasks) || 0;
  const completed = Number(row.completed_tasks) || 0;
  const delayed = Number(row.delayed_tasks) || 0;

  const calcPct = (count) => (total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0);

  return {
    total_tasks: total,
    pending_tasks: pending,
    in_progress_tasks: inProgress,
    pending_review_tasks: pendingReview,
    completed_tasks: completed,
    delayed_tasks: delayed,
    percentages: {
      pending: calcPct(pending),
      in_progress: calcPct(inProgress),
      pending_review: calcPct(pendingReview),
      completed: calcPct(completed),
      delayed: calcPct(delayed),
    },
  };
}

async function getTeamsPerformance() {
  const query = `
    SELECT 
      t.id AS team_id,
      t.name AS team_name,
      u.name AS leader_name,
      COALESCE(ts.total_tasks, 0) AS total_tasks,
      COALESCE(ts.completed_tasks, 0) AS completed_tasks,
      COALESCE(ts.in_progress_tasks, 0) AS in_progress_tasks,
      COALESCE(ts.pending_tasks, 0) AS pending_tasks,
      COALESCE(ts.pending_review_tasks, 0) AS pending_review_tasks,
      COALESCE(ts.delayed_tasks, 0) AS delayed_tasks,
      ROUND(CASE WHEN COALESCE(ts.total_tasks, 0) > 0 THEN (ts.completed_tasks * 100.0 / ts.total_tasks) ELSE 0 END, 1) AS completion_rate,
      ROUND(ts.avg_quality_rating, 2) AS avg_quality_rating
    FROM teams t
    LEFT JOIN users u ON t.leader_id = u.id
    LEFT JOIN (
      SELECT 
        team_id,
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN status = 'PendingReview' THEN 1 ELSE 0 END) AS pending_review_tasks,
        SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) AS delayed_tasks,
        AVG(quality_rating) AS avg_quality_rating
      FROM tasks
      WHERE team_id IS NOT NULL
      GROUP BY team_id
    ) ts ON t.id = ts.team_id
    ORDER BY t.name ASC
  `;

  const [rows] = await pool.execute(query);
  return rows.map((r) => ({
    team_id: r.team_id,
    team_name: r.team_name,
    leader_name: r.leader_name || "Unassigned",
    total_tasks: Number(r.total_tasks),
    completed_tasks: Number(r.completed_tasks),
    in_progress_tasks: Number(r.in_progress_tasks),
    pending_tasks: Number(r.pending_tasks),
    pending_review_tasks: Number(r.pending_review_tasks),
    delayed_tasks: Number(r.delayed_tasks),
    completion_rate: Number(r.completion_rate) || 0,
    avg_quality_rating: r.avg_quality_rating !== null ? Number(r.avg_quality_rating) : null,
  }));
}

async function createTeamReport({ team_id, leader_id, feedback }) {
  const [result] = await pool.execute(
    `INSERT INTO team_reports (team_id, leader_id, feedback)
     VALUES (?, ?, ?)`,
    [team_id, leader_id, feedback]
  );
  return {
    id: result.insertId,
    team_id,
    leader_id,
    feedback,
    created_at: new Date(),
  };
}

async function findTeamReports(teamId = null) {
  const params = [];
  let where = "";
  if (teamId !== null && teamId !== undefined) {
    where = "WHERE r.team_id = ?";
    params.push(teamId);
  }

  const query = `
    SELECT 
      r.id,
      r.team_id,
      t.name AS team_name,
      r.leader_id,
      u.name AS leader_name,
      r.feedback,
      r.created_at
    FROM team_reports r
    JOIN teams t ON r.team_id = t.id
    LEFT JOIN users u ON r.leader_id = u.id
    ${where}
    ORDER BY r.created_at DESC
  `;

  const [rows] = await pool.execute(query, params);
  return rows;
}

module.exports = {
  getStatusOverview,
  getTeamsPerformance,
  createTeamReport,
  findTeamReports,
};
