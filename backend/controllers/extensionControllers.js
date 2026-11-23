const extensionModel = require("../models/extensionModel");
const taskModel = require("../models/taskModel");
const teamModel = require("../models/teamModel");
const userModel = require("../models/userModel");
const notificationService = require("../services/notificationService");
const { pool } = require("../config/db");

async function getExtensions(request, response) {
  const filters = {};

  if (request.user.role === "team_leader") {
    filters.team_id = request.user.team_id || -1;
  } else if (request.user.role === "member") {
    filters.user_id = request.user.id;
  } else if (request.user.role === "manager") {
    if (request.query.team_id) filters.team_id = request.query.team_id;
    if (request.query.user_id) filters.user_id = request.query.user_id;
    if (request.query.task_id) filters.task_id = request.query.task_id;
  }

  const extensions = await extensionModel.findAll(filters);

  return response.status(200).jsend.success({
    message: "Extension requests retrieved successfully",
    data: {
      extensions,
    },
  });
}

async function createExtension(request, response) {
  const { task_id, requested_deadline, reason } = request.body;

  const task = await taskModel.findById(task_id);
  if (!task) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (Number(task.assigned_to) !== Number(request.user.id)) {
    return response.status(403).jsend.error({
      code: 403,
      message: "You can only request deadline extensions for tasks assigned to you",
    });
  }

  // Extensions only allowed when task is In Progress or Delayed
  if (task.status !== "In Progress" && task.status !== "Delayed") {
    return response.status(400).jsend.error({
      code: 400,
      message: "Deadline extensions can only be requested for tasks that are In Progress or Delayed",
    });
  }

  // Requested deadline must be strictly after current deadline
  if (requested_deadline <= task.deadline) {
    return response.status(400).jsend.error({
      code: 400,
      message: "Requested deadline must be strictly later than the current task deadline",
    });
  }

  // Prevent duplicate pending extension for the same task
  const existing = await extensionModel.findAll({ task_id });
  const hasPending = existing.some((e) => e.status === "Pending");
  if (hasPending) {
    return response.status(400).jsend.error({
      code: 400,
      message: "A pending extension request already exists for this task",
    });
  }

  const newExtension = await extensionModel.create({
    task_id,
    user_id: request.user.id,
    requested_deadline,
    reason,
  });

  // Notify Team Leader or Managers
  let leaderNotified = false;
  if (task.team_id) {
    const team = await teamModel.findById(task.team_id);
    if (team && team.leader_id && Number(team.leader_id) !== Number(request.user.id)) {
      await notificationService.notifyUser({
        userId: team.leader_id,
        type: "EXTENSION_REQUESTED",
        message: `${request.user.name} requested a deadline extension for "${task.title}".`,
        relatedTaskId: task.id,
      });
      leaderNotified = true;
    }
  }

  if (!leaderNotified) {
    const managers = await userModel.findManagers();
    const managerIds = managers
      .filter((m) => Number(m.id) !== Number(request.user.id))
      .map((m) => m.id);

    await notificationService.notifyUsers(managerIds, {
      type: "EXTENSION_REQUESTED",
      message: `${request.user.name} requested a deadline extension for "${task.title}".`,
      relatedTaskId: task.id,
    });
  }

  return response.status(201).jsend.success({
    message: "Extension request submitted successfully",
    data: {
      extension: newExtension,
    },
  });
}

async function reviewExtension(request, response) {
  const extensionId = Number(request.params.id);
  const { status } = request.body;

  const extension = await extensionModel.findById(extensionId);
  if (!extension) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Extension request not found",
    });
  }

  if (extension.status !== "Pending") {
    return response.status(400).jsend.error({
      code: 400,
      message: "Only pending extension requests can be reviewed",
    });
  }

  if (
    request.user.role === "team_leader" &&
    Number(extension.team_id) !== Number(request.user.team_id)
  ) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you can only review extension requests for your team",
    });
  }

  if (status === "Approved") {
    await pool.execute(
      `UPDATE tasks
       SET deadline = ?,
           status = CASE WHEN status = 'Delayed' THEN 'In Progress' ELSE status END
       WHERE id = ?`,
      [extension.requested_deadline, extension.task_id]
    );

    await extensionModel.updateStatus(extensionId, {
      status: "Approved",
      reviewed_by: request.user.id,
    });

    await notificationService.notifyUser({
      userId: extension.user_id,
      type: "EXTENSION_APPROVED",
      message: `Your extension request for task "${extension.task_title}" was approved. New deadline: ${extension.requested_deadline}.`,
      relatedTaskId: extension.task_id,
    });
  } else {
    await extensionModel.updateStatus(extensionId, {
      status: "Rejected",
      reviewed_by: request.user.id,
    });

    await notificationService.notifyUser({
      userId: extension.user_id,
      type: "EXTENSION_REJECTED",
      message: `Your extension request for task "${extension.task_title}" was rejected.`,
      relatedTaskId: extension.task_id,
    });
  }

  const updatedExtension = await extensionModel.findById(extensionId);

  return response.status(200).jsend.success({
    message: `Extension request ${status.toLowerCase()} successfully`,
    data: {
      extension: updatedExtension,
    },
  });
}

module.exports = {
  getExtensions,
  createExtension,
  reviewExtension,
};
