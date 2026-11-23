const express = require("express");
const router = express.Router();

const notificationControllers = require("../controllers/notificationControllers");
const authMiddleware = require("../middlewares/authMiddleware");

// All notification routes are protected
router.use(authMiddleware);

router.get("/", notificationControllers.getNotifications);
router.patch("/read-all", notificationControllers.markAllAsRead);
router.patch("/:id/read", notificationControllers.markOneAsRead);

module.exports = router;
