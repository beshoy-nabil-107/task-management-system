const reportModel = require("../models/reportModel");
const userModel = require("../models/userModel");
const notificationService = require("../services/notificationService");

async function getStatusOverview(request, response) {
  let teamId = null;

  if (request.user.role === "team_leader") {
    teamId = request.user.team_id || -1;
  } else if (request.user.role === "manager" && request.query.team_id) {
    teamId = Number(request.query.team_id);
  }

  const overview = await reportModel.getStatusOverview(teamId);

  return response.status(200).jsend.success({
    message: "Status overview retrieved successfully",
    data: {
      overview,
    },
  });
}

async function getPerformance(request, response) {
  const [teams, teamReports] = await Promise.all([
    reportModel.getTeamsPerformance(),
    reportModel.findTeamReports(),
  ]);

  const averageProductivity =
    teams.length > 0
      ? Number(
          (
            teams.reduce((sum, t) => sum + t.completion_rate, 0) / teams.length
          ).toFixed(1)
        )
      : 0;

  const activeTeams = teams.filter((t) => t.total_tasks > 0);
  let mostProductiveTeam = null;

  if (activeTeams.length > 0) {
    mostProductiveTeam = activeTeams.reduce((best, curr) => {
      if (!best) return curr;
      if (curr.completion_rate > best.completion_rate) return curr;
      if (curr.completion_rate < best.completion_rate) return best;

      // Tie-breaker 1: avg_quality_rating
      const bestRating = best.avg_quality_rating || 0;
      const currRating = curr.avg_quality_rating || 0;
      if (currRating > bestRating) return curr;
      if (currRating < bestRating) return best;

      // Tie-breaker 2: completed_tasks
      if (curr.completed_tasks > best.completed_tasks) return curr;
      return best;
    }, null);
  }

  return response.status(200).jsend.success({
    message: "Performance report retrieved successfully",
    data: {
      teams,
      averageProductivity,
      mostProductiveTeam,
      teamReports,
    },
  });
}

async function getTeamFeedback(request, response) {
  let teamId = null;

  if (request.user.role === "team_leader") {
    teamId = request.user.team_id || -1;
  } else if (request.user.role === "manager" && request.query.team_id) {
    teamId = Number(request.query.team_id);
  }

  const reports = await reportModel.findTeamReports(teamId);

  return response.status(200).jsend.success({
    message: "Team reports retrieved successfully",
    data: {
      reports,
    },
  });
}

async function createTeamFeedback(request, response) {
  if (!request.user.team_id) {
    return response.status(400).jsend.error({
      code: 400,
      message: "You must be assigned to lead a team before submitting a performance report",
    });
  }

  const { feedback } = request.body;
  const newReport = await reportModel.createTeamReport({
    team_id: request.user.team_id,
    leader_id: request.user.id,
    feedback,
  });

  const managers = await userModel.findManagers();
  const managerIds = managers
    .filter((m) => Number(m.id) !== Number(request.user.id))
    .map((m) => m.id);

  await notificationService.notifyUsers(managerIds, {
    type: "TEAM_REPORT_SUBMITTED",
    message: `Team Leader ${request.user.name} submitted a new performance report.`,
  });

  return response.status(201).jsend.success({
    message: "Team feedback submitted successfully",
    data: {
      report: newReport,
    },
  });
}

module.exports = {
  getStatusOverview,
  getPerformance,
  getTeamFeedback,
  createTeamFeedback,
};
