const teamModel = require("../models/teamModel");
const userModel = require("../models/userModel");
const notificationService = require("../services/notificationService");

async function getTeams(request, response) {
  let teams = [];

  if (request.user.role === "manager") {
    teams = await teamModel.findAll();
  } else {
    // Team Leader or Member: see only their own team
    if (request.user.team_id) {
      const myTeam = await teamModel.findById(request.user.team_id);
      if (myTeam) {
        teams = [myTeam];
      }
    }
  }

  return response.status(200).jsend.success({
    message: "Teams retrieved successfully",
    data: {
      teams,
    },
  });
}

async function getTeamById(request, response) {
  const teamId = Number(request.params.id);

  if (request.user.role !== "manager" && Number(request.user.team_id) !== teamId) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you can only view details of your assigned team",
    });
  }

  const team = await teamModel.findById(teamId);
  if (!team) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Team not found",
    });
  }

  return response.status(200).jsend.success({
    message: "Team details retrieved successfully",
    data: {
      team,
    },
  });
}

async function createTeam(request, response) {
  const { name, description, leader_id } = request.body;

  let leader = null;
  if (leader_id) {
    leader = await userModel.findById(leader_id);
    if (!leader) {
      return response.status(404).jsend.error({
        code: 404,
        message: "Assigned leader user does not exist",
      });
    }
  }

  const newTeam = await teamModel.create({
    name,
    description: description || null,
    leader_id: leader_id || null,
  });

  if (leader_id) {
    await userModel.updateRoleAndTeam(leader_id, {
      team_id: newTeam.id,
      role: leader.role === "member" ? "team_leader" : leader.role,
    });

    await notificationService.notifyUser({
      userId: leader_id,
      type: "TEAM_ASSIGNED",
      message: `You have been appointed as the team leader of "${newTeam.name}".`,
    });
  }

  const completeTeam = await teamModel.findById(newTeam.id);

  return response.status(201).jsend.success({
    message: "Team created successfully",
    data: {
      team: completeTeam,
    },
  });
}

async function updateTeam(request, response) {
  const teamId = Number(request.params.id);
  const { name, description, leader_id } = request.body;

  const existingTeam = await teamModel.findById(teamId);
  if (!existingTeam) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Team not found",
    });
  }

  let leader = null;
  if (leader_id !== undefined && leader_id !== null) {
    leader = await userModel.findById(leader_id);
    if (!leader) {
      return response.status(404).jsend.error({
        code: 404,
        message: "Assigned leader user does not exist",
      });
    }
  }

  const updatedTeam = await teamModel.update(teamId, {
    name,
    description,
    leader_id,
  });

  if (leader_id && Number(leader_id) !== Number(existingTeam.leader_id)) {
    await userModel.updateRoleAndTeam(leader_id, {
      team_id: teamId,
      role: leader.role === "member" ? "team_leader" : leader.role,
    });

    await notificationService.notifyUser({
      userId: leader_id,
      type: "TEAM_ASSIGNED",
      message: `You have been appointed as the team leader of "${updatedTeam.name}".`,
    });
  }

  const completeTeam = await teamModel.findById(teamId);

  return response.status(200).jsend.success({
    message: "Team updated successfully",
    data: {
      team: completeTeam,
    },
  });
}

async function addMember(request, response) {
  const teamId = Number(request.params.id);
  const { user_id } = request.body;

  const team = await teamModel.findById(teamId);
  if (!team) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Team not found",
    });
  }

  const user = await userModel.findById(user_id);
  if (!user) {
    return response.status(404).jsend.error({
      code: 404,
      message: "User not found",
    });
  }

  await teamModel.assignMember(teamId, user_id);

  await notificationService.notifyUser({
    userId: user_id,
    type: "TEAM_ASSIGNED",
    message: `You have been assigned to team "${team.name}".`,
  });

  const updatedTeam = await teamModel.findById(teamId);

  return response.status(200).jsend.success({
    message: "Member added to team successfully",
    data: {
      team: updatedTeam,
    },
  });
}

async function removeMember(request, response) {
  const teamId = Number(request.params.id);
  const userId = Number(request.params.userId);

  const team = await teamModel.findById(teamId);
  if (!team) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Team not found",
    });
  }

  await teamModel.removeMember(teamId, userId);

  await notificationService.notifyUser({
    userId,
    type: "TEAM_REMOVED",
    message: `You have been removed from team "${team.name}".`,
  });

  const updatedTeam = await teamModel.findById(teamId);

  return response.status(200).jsend.success({
    message: "Member removed from team successfully",
    data: {
      team: updatedTeam,
    },
  });
}

async function deleteTeam(request, response) {
  const teamId = Number(request.params.id);

  const team = await teamModel.findById(teamId);
  if (!team) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Team not found",
    });
  }

  await teamModel.deleteById(teamId);

  return response.status(200).jsend.success({
    message: "Team deleted successfully",
    data: null,
  });
}

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  addMember,
  removeMember,
  deleteTeam,
};
