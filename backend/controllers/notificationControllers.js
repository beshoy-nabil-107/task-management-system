const notificationModel = require("../models/notificationModel");

async function getNotifications(request, response) {
  const userId = request.user.id;
  const [notifications, unreadCount] = await Promise.all([
    notificationModel.findByUserId(userId),
    notificationModel.countUnreadByUserId(userId),
  ]);

  return response.status(200).jsend.success({
    message: "Notifications retrieved successfully",
    data: {
      notifications,
      unreadCount,
    },
  });
}

async function markOneAsRead(request, response) {
  const userId = request.user.id;
  const notificationId = request.params.id;

  const success = await notificationModel.markAsRead(notificationId, userId);
  if (!success) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Notification not found or already marked as read",
    });
  }

  return response.status(200).jsend.success({
    message: "Notification marked as read successfully",
    data: null,
  });
}

async function markAllAsRead(request, response) {
  const userId = request.user.id;
  const updatedCount = await notificationModel.markAllAsRead(userId);

  return response.status(200).jsend.success({
    message: "All notifications marked as read successfully",
    data: {
      updatedCount,
    },
  });
}

module.exports = {
  getNotifications,
  markOneAsRead,
  markAllAsRead,
};
