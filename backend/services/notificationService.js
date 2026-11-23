const notificationModel = require("../models/notificationModel");

async function notifyUser({ userId, type = "GENERAL", message, relatedTaskId = null }) {
  try {
    if (!userId) {
      return null;
    }
    return await notificationModel.create({
      user_id: userId,
      type,
      message,
      related_task_id: relatedTaskId,
    });
  } catch (error) {
    console.error("Failed to send in-app notification to user:", userId, error.message);
    return null;
  }
}

async function notifyUsers(userIds, { type = "GENERAL", message, relatedTaskId = null }) {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }

    // Deduplicate and filter out invalid/falsy IDs
    const uniqueIds = Array.from(new Set(userIds.filter((id) => Boolean(id))));
    if (uniqueIds.length === 0) {
      return [];
    }

    const notifications = uniqueIds.map((userId) => ({
      user_id: userId,
      type,
      message,
      related_task_id: relatedTaskId,
    }));

    return await notificationModel.createMany(notifications);
  } catch (error) {
    console.error("Failed to send bulk in-app notifications:", error.message);
    return [];
  }
}

module.exports = {
  notifyUser,
  notifyUsers,
};
