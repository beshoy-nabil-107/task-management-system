const userModel = require("../models/userModel");
const notificationService = require("../services/notificationService");

async function getUsers(request, response) {
  let users = [];

  if (request.user.role === "manager") {
    users = await userModel.findAll();
  } else if (request.user.role === "team_leader") {
    if (request.user.team_id) {
      users = await userModel.findByTeamId(request.user.team_id);
    } else {
      users = [];
    }
  }

  return response.status(200).jsend.success({
    message: "Users retrieved successfully",
    data: {
      users,
    },
  });
}

async function updateUserRole(request, response) {
  const targetUserId = Number(request.params.id);
  const { role, team_id } = request.body;

  // Prevent manager from demoting their own account
  if (targetUserId === Number(request.user.id) && role !== "manager") {
    return response.status(400).jsend.error({
      code: 400,
      message: "You cannot change your own role",
    });
  }

  const targetUser = await userModel.findById(targetUserId);
  if (!targetUser) {
    return response.status(404).jsend.error({
      code: 404,
      message: "User not found",
    });
  }

  const updatedUser = await userModel.updateRoleAndTeam(targetUserId, {
    role,
    team_id: team_id !== undefined ? team_id : targetUser.team_id,
  });

  await notificationService.notifyUser({
    userId: targetUserId,
    type: "ROLE_UPDATED",
    message: `Your account role has been updated to "${role}".`,
  });

  return response.status(200).jsend.success({
    message: "User role updated successfully",
    data: {
      user: updatedUser,
    },
  });
}

async function deleteUser(request, response) {
  const targetUserId = Number(request.params.id);

  if (targetUserId === Number(request.user.id)) {
    return response.status(400).jsend.error({
      code: 400,
      message: "You cannot delete your own account",
    });
  }

  const targetUser = await userModel.findById(targetUserId);
  if (!targetUser) {
    return response.status(404).jsend.error({
      code: 404,
      message: "User not found",
    });
  }

  await userModel.deleteById(targetUserId);

  return response.status(200).jsend.success({
    message: "User deleted successfully",
    data: null,
  });
}

module.exports = {
  getUsers,
  updateUserRole,
  deleteUser,
};
