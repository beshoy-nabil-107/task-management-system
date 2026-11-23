const express = require("express");
const router = express.Router();

const authControllers = require("../controllers/authControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateSchema } = require("../middlewares/schemaMiddleware");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require("../validators/authValidators");

router.post("/register", validateSchema(registerSchema), authControllers.register);
router.post("/login", validateSchema(loginSchema), authControllers.login);
router.get("/me", authMiddleware, authControllers.myProfile);
router.put(
  "/me",
  authMiddleware,
  validateSchema(updateProfileSchema),
  authControllers.updateMyProfile
);

module.exports = router;
