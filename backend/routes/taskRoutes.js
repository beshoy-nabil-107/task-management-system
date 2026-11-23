const express = require("express");
const multer = require("multer");
const router = express.Router();

const taskControllers = require("../controllers/taskControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { validateSchema } = require("../middlewares/schemaMiddleware");
const {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  reviewTaskSchema,
} = require("../validators/taskValidators");

// Multer memory storage (5MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// All task routes are protected
router.use(authMiddleware);

router.get("/", taskControllers.getTasks);
router.get("/:id", taskControllers.getTaskById);

router.post(
  "/",
  authorizeRoles("manager", "team_leader"),
  validateSchema(createTaskSchema),
  taskControllers.createTask
);

router.put(
  "/:id",
  authorizeRoles("manager", "team_leader"),
  validateSchema(updateTaskSchema),
  taskControllers.updateTask
);

router.delete(
  "/:id",
  authorizeRoles("manager", "team_leader"),
  taskControllers.deleteTask
);

router.patch(
  "/:id/status",
  validateSchema(updateStatusSchema),
  taskControllers.updateTaskStatus
);

router.post(
  "/:id/review",
  authorizeRoles("manager", "team_leader"),
  validateSchema(reviewTaskSchema),
  taskControllers.reviewTask
);

router.post(
  "/:id/attachments",
  upload.single("file"),
  taskControllers.addAttachment
);

router.get(
  "/:id/attachments/:attachmentId/download",
  taskControllers.downloadAttachment
);

module.exports = router;
