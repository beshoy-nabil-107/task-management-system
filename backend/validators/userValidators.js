const Joi = require("joi");

const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid("manager", "team_leader", "member")
    .required()
    .messages({
      "any.only": "Role must be one of 'manager', 'team_leader', or 'member'",
      "any.required": "Role is required",
    }),
  team_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      "number.base": "Team ID must be a valid integer or null",
    }),
});

module.exports = {
  updateUserRoleSchema,
};
