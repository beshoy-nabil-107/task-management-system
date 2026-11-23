const taskModel = require("../models/taskModel");
const teamModel = require("../models/teamModel");
const userModel = require("../models/userModel");
const attachmentModel = require("../models/attachmentModel");
const extensionModel = require("../models/extensionModel");
const notificationService = require("../services/notificationService");

function hasTaskAccess(user, task) {
  if (user.role === "manager") {
    return true;
  }
  if (user.role === "team_leader") {
    return user.team_id && Number(task.team_id) === Number(user.team_id);
  }
  if (user.role === "member") {
    return Number(task.assigned_to) === Number(user.id);
  }
  return false;
}

async function getTasks(request, response) {
  const filters = { ...request.query };

  if (request.user.role === "team_leader") {
    filters.team_id = request.user.team_id || -1;
  } else if (request.user.role === "member") {
    filters.assigned_to = request.user.id;
  }

  const tasks = await taskModel.findAll(filters);

  return response.status(200).jsend.success({
    message: "Tasks retrieved successfully",
    data: {
      tasks,
    },
  });
}

async function getTaskById(request, response) {
  const taskId = Number(request.params.id);
  const task = await taskModel.findById(taskId);

  if (!task) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (!hasTaskAccess(request.user, task)) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you do not have permission to view this task",
    });
  }

  const [attachments, extensions] = await Promise.all([
    attachmentModel.findByTaskId(taskId),
    extensionModel.findAll({ task_id: taskId }),
  ]);

  return response.status(200).jsend.success({
    message: "Task details retrieved successfully",
    data: {
      task,
      attachments,
      extensions,
    },
  });
}

async function createTask(request, response) {
  const { title, description, priority, deadline, milestone_id } = request.body;
  let team_id = request.body.team_id;
  let assigned_to = request.body.assigned_to;

  if (request.user.role === "team_leader") {
    if (!request.user.team_id) {
      return response.status(400).jsend.error({
        code: 400,
        message: "You are not currently assigned to lead any team",
      });
    }
    team_id = request.user.team_id;

    if (assigned_to) {
      const assignedUser = await userModel.findById(assigned_to);
      if (!assignedUser || Number(assignedUser.team_id) !== Number(team_id)) {
        return response.status(400).jsend.error({
          code: 400,
          message: "Assigned user does not belong to your team",
        });
      }
    }
  } else if (request.user.role === "manager") {
    if (assigned_to) {
      const assignedUser = await userModel.findById(assigned_to);
      if (!assignedUser) {
        return response.status(404).jsend.error({
          code: 404,
          message: "Assigned user not found",
        });
      }
      if (!team_id && assignedUser.team_id) {
        team_id = assignedUser.team_id;
      }
    }
  }

  const newTask = await taskModel.create({
    title,
    description: description || null,
    priority: priority || "Medium",
    deadline,
    team_id: team_id || null,
    assigned_to: assigned_to || null,
    created_by: request.user.id,
    milestone_id: milestone_id || null,
  });

  // Notifications
  if (newTask.assigned_to) {
    await notificationService.notifyUser({
      userId: newTask.assigned_to,
      type: "TASK_ASSIGNED",
      message: `You have been assigned to task: "${newTask.title}".`,
      relatedTaskId: newTask.id,
    });
  } else if (newTask.team_id) {
    const team = await teamModel.findById(newTask.team_id);
    if (team && team.leader_id && Number(team.leader_id) !== Number(request.user.id)) {
      await notificationService.notifyUser({
        userId: team.leader_id,
        type: "TEAM_TASK_CREATED",
        message: `A new task "${newTask.title}" was created for your team.`,
        relatedTaskId: newTask.id,
      });
    }
  }

  return response.status(201).jsend.success({
    message: "Task created successfully",
    data: {
      task: newTask,
    },
  });
}

async function updateTask(request, response) {
  const taskId = Number(request.params.id);
  const existingTask = await taskModel.findById(taskId);

  if (!existingTask) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (request.user.role === "team_leader") {
    if (Number(existingTask.team_id) !== Number(request.user.team_id)) {
      return response.status(403).jsend.error({
        code: 403,
        message: "Access forbidden: you can only edit tasks within your team",
      });
    }

    if (request.body.team_id && Number(request.body.team_id) !== Number(request.user.team_id)) {
      return response.status(400).jsend.error({
        code: 400,
        message: "You cannot transfer tasks to a different team",
      });
    }

    if (request.body.assigned_to) {
      const assignedUser = await userModel.findById(request.body.assigned_to);
      if (!assignedUser || Number(assignedUser.team_id) !== Number(request.user.team_id)) {
        return response.status(400).jsend.error({
          code: 400,
          message: "Assigned user does not belong to your team",
        });
      }
    }
  }

  const updatedTask = await taskModel.update(taskId, request.body);

  if (
    request.body.assigned_to &&
    Number(request.body.assigned_to) !== Number(existingTask.assigned_to)
  ) {
    await notificationService.notifyUser({
      userId: request.body.assigned_to,
      type: "TASK_ASSIGNED",
      message: `You have been assigned to task: "${updatedTask.title}".`,
      relatedTaskId: updatedTask.id,
    });
  }

  return response.status(200).jsend.success({
    message: "Task updated successfully",
    data: {
      task: updatedTask,
    },
  });
}

async function deleteTask(request, response) {
  const taskId = Number(request.params.id);
  const task = await taskModel.findById(taskId);

  if (!task) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (
    request.user.role === "team_leader" &&
    Number(task.team_id) !== Number(request.user.team_id)
  ) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you can only delete tasks belonging to your team",
    });
  }

  await taskModel.deleteById(taskId);

  return response.status(200).jsend.success({
    message: "Task deleted successfully",
    data: null,
  });
}

async function updateTaskStatus(request, response) {
  const taskId = Number(request.params.id);
  const { status } = request.body;
  const task = await taskModel.findById(taskId);

  if (!task) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (!hasTaskAccess(request.user, task)) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you do not have permission to update this task status",
    });
  }

  let finalStatus = status;

  // Enforce Member workflow rules
  if (request.user.role === "member") {
    // Members can only: Pending->InProgress, InProgress/Delayed->PendingReview, InProgress<->Delayed
    const allowedTransitions = {
      Pending: ["In Progress"],
      "In Progress": ["PendingReview", "Delayed"],
      Delayed: ["PendingReview", "In Progress"],
      PendingReview: [], // locked awaiting review
      Completed: [],     // locked
    };
    const allowed = allowedTransitions[task.status] || [];
    // Map "Completed" or "PendingReview" submitted by member to PendingReview
    const targetStatus = (status === "Completed") ? "PendingReview" : status;
    if (!allowed.includes(targetStatus)) {
      return response.status(400).jsend.error({
        code: 400,
        message: `Cannot transition task from "${task.status}" to "${status}"`,
      });
    }
    finalStatus = targetStatus;
  }

  const updatedTask = await taskModel.updateStatus(taskId, finalStatus);

  // If member submitted for review, notify team leader or managers
  if (request.user.role === "member" && finalStatus === "PendingReview") {
    let leaderNotified = false;

    if (task.team_id) {
      const team = await teamModel.findById(task.team_id);
      if (team && team.leader_id) {
        await notificationService.notifyUser({
          userId: team.leader_id,
          type: "TASK_SUBMITTED",
          message: `Task "${task.title}" was submitted for review by ${request.user.name}.`,
          relatedTaskId: task.id,
        });
        leaderNotified = true;
      }
    }

    if (!leaderNotified) {
      const managers = await userModel.findManagers();
      const managerIds = managers.map((m) => m.id);
      await notificationService.notifyUsers(managerIds, {
        type: "TASK_SUBMITTED",
        message: `Task "${task.title}" was submitted for review by ${request.user.name}.`,
        relatedTaskId: task.id,
      });
    }
  }

  return response.status(200).jsend.success({
    message: "Task status updated successfully",
    data: {
      task: updatedTask,
    },
  });
}

async function reviewTask(request, response) {
  const taskId = Number(request.params.id);
  const { decision, quality_rating, review_feedback } = request.body;

  const task = await taskModel.findById(taskId);
  if (!task) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (
    request.user.role === "team_leader" &&
    Number(task.team_id) !== Number(request.user.team_id)
  ) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you can only review tasks within your team",
    });
  }

  if (task.status !== "PendingReview") {
    return response.status(400).jsend.error({
      code: 400,
      message: "Only tasks with status PendingReview can be reviewed",
    });
  }

  let finalStatus;
  let ratingToSave = null;

  if (decision === "approve") {
    finalStatus = "Completed";
    ratingToSave = quality_rating;
  } else {
    finalStatus = "In Progress";
    ratingToSave = null;
  }

  const updatedTask = await taskModel.submitReview(taskId, {
    status: finalStatus,
    quality_rating: ratingToSave,
    review_feedback: review_feedback || null,
    reviewed_by: request.user.id,
  });

  if (task.assigned_to) {
    const notifyType = decision === "approve" ? "TASK_APPROVED" : "TASK_REJECTED";
    const notifyMsg =
      decision === "approve"
        ? `Your submission for task "${task.title}" has been approved with rating ${quality_rating}/5!`
        : `Your submission for task "${task.title}" was rejected. Feedback: ${review_feedback}`;

    await notificationService.notifyUser({
      userId: task.assigned_to,
      type: notifyType,
      message: notifyMsg,
      relatedTaskId: task.id,
    });
  }

  return response.status(200).jsend.success({
    message: `Task review submitted successfully (${decision})`,
    data: {
      task: updatedTask,
    },
  });
}

async function addAttachment(request, response) {
  const taskId = Number(request.params.id);
  const task = await taskModel.findById(taskId);

  if (!task) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (!hasTaskAccess(request.user, task)) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you do not have permission to add attachments to this task",
    });
  }

  const note = request.body.note ? request.body.note.trim() : null;
  const file = request.file;

  if (!note && !file) {
    return response.status(400).jsend.error({
      code: 400,
      message: "At least a note or a file must be provided",
    });
  }

  const newAttachment = await attachmentModel.create({
    task_id: taskId,
    user_id: request.user.id,
    note: note || null,
    file_name: file ? file.originalname : null,
    file_type: file ? file.mimetype : null,
    file_size: file ? file.size : null,
    file_data: file ? file.buffer : null,
  });

  return response.status(201).jsend.success({
    message: "Attachment added successfully",
    data: {
      attachment: newAttachment,
    },
  });
}

async function downloadAttachment(request, response) {
  const taskId = Number(request.params.id);
  const attachmentId = Number(request.params.attachmentId);

  const task = await taskModel.findById(taskId);
  if (!task) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Task not found",
    });
  }

  if (!hasTaskAccess(request.user, task)) {
    return response.status(403).jsend.error({
      code: 403,
      message: "Access forbidden: you do not have permission to download this attachment",
    });
  }

  const attachment = await attachmentModel.findFileById(attachmentId, taskId);
  if (!attachment || !attachment.file_data) {
    return response.status(404).jsend.error({
      code: 404,
      message: "File not found",
    });
  }

  response.setHeader("Content-Type", attachment.file_type || "application/octet-stream");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(attachment.file_name)}"`
  );
  response.setHeader("Content-Length", attachment.file_size || attachment.file_data.length);

  return response.send(attachment.file_data);
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  reviewTask,
  addAttachment,
  downloadAttachment,
};
