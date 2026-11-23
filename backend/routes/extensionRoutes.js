const express = require("express");
const router = express.Router();

const extensionControllers = require("../controllers/extensionControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { validateSchema } = require("../middlewares/schemaMiddleware");
const {
  createExtensionSchema,
  reviewExtensionSchema,
} = require("../validators/extensionValidators");

// All extension routes are protected
router.use(authMiddleware);

router.get("/", extensionControllers.getExtensions);

router.post(
  "/",
  authorizeRoles("member", "team_leader"),
  validateSchema(createExtensionSchema),
  extensionControllers.createExtension
);

router.patch(
  "/:id",
  authorizeRoles("manager", "team_leader"),
  validateSchema(reviewExtensionSchema),
  extensionControllers.reviewExtension
);

module.exports = router;
