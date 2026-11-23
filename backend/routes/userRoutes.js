const express = require("express");
const router = express.Router();

const userControllers = require("../controllers/userControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { validateSchema } = require("../middlewares/schemaMiddleware");
const { updateUserRoleSchema } = require("../validators/userValidators");

// All user routes are protected
router.use(authMiddleware);

router.get("/", authorizeRoles("manager", "team_leader"), userControllers.getUsers);
router.patch(
  "/:id/role",
  authorizeRoles("manager"),
  validateSchema(updateUserRoleSchema),
  userControllers.updateUserRole
);
router.delete("/:id", authorizeRoles("manager"), userControllers.deleteUser);

module.exports = router;
