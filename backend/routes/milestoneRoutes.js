const express = require("express");
const router = express.Router();

const milestoneControllers = require("../controllers/milestoneControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { validateSchema } = require("../middlewares/schemaMiddleware");
const {
  createMilestoneSchema,
  updateMilestoneSchema,
} = require("../validators/milestoneValidators");

// All milestone routes are protected
router.use(authMiddleware);

router.get("/", milestoneControllers.getMilestones);
router.get("/:id", milestoneControllers.getMilestoneById);

router.post(
  "/",
  authorizeRoles("manager"),
  validateSchema(createMilestoneSchema),
  milestoneControllers.createMilestone
);

router.put(
  "/:id",
  authorizeRoles("manager"),
  validateSchema(updateMilestoneSchema),
  milestoneControllers.updateMilestone
);

router.delete(
  "/:id",
  authorizeRoles("manager"),
  milestoneControllers.deleteMilestone
);

module.exports = router;
