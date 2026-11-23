const express = require("express");
const router = express.Router();

const teamControllers = require("../controllers/teamControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { validateSchema } = require("../middlewares/schemaMiddleware");
const {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
} = require("../validators/teamValidators");

// All team routes are protected
router.use(authMiddleware);

router.get("/", teamControllers.getTeams);
router.get("/:id", teamControllers.getTeamById);

router.post(
  "/",
  authorizeRoles("manager"),
  validateSchema(createTeamSchema),
  teamControllers.createTeam
);

router.put(
  "/:id",
  authorizeRoles("manager"),
  validateSchema(updateTeamSchema),
  teamControllers.updateTeam
);

router.post(
  "/:id/members",
  authorizeRoles("manager"),
  validateSchema(addMemberSchema),
  teamControllers.addMember
);

router.delete(
  "/:id/members/:userId",
  authorizeRoles("manager"),
  teamControllers.removeMember
);

router.delete(
  "/:id",
  authorizeRoles("manager"),
  teamControllers.deleteTeam
);

module.exports = router;
