const Joi = require("joi");

const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Team name is required",
    "string.min": "Team name must be at least 2 characters",
    "string.max": "Team name cannot exceed 100 characters",
    "any.required": "Team name is required",
  }),
  description: Joi.string().trim().allow("", null).optional(),
  leader_id: Joi.number().integer().positive().allow(null).optional(),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().allow("", null).optional(),
  leader_id: Joi.number().integer().positive().allow(null).optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided to update the team",
});

const addMemberSchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    "number.base": "User ID must be a valid number",
    "any.required": "User ID is required to add member",
  }),
});

module.exports = {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
};
