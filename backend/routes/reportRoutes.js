const express = require("express");
const router = express.Router();

const reportControllers = require("../controllers/reportControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { validateSchema } = require("../middlewares/schemaMiddleware");
const { teamReportSchema } = require("../validators/reportValidators");

// All report routes are protected
router.use(authMiddleware);

router.get(
  "/overview",
  authorizeRoles("manager", "team_leader"),
  reportControllers.getStatusOverview
);

router.get(
  "/performance",
  authorizeRoles("manager"),
  reportControllers.getPerformance
);

router.get(
  "/team-feedback",
  authorizeRoles("manager", "team_leader"),
  reportControllers.getTeamFeedback
);

router.post(
  "/team-feedback",
  authorizeRoles("team_leader"),
  validateSchema(teamReportSchema),
  reportControllers.createTeamFeedback
);

module.exports = router;
