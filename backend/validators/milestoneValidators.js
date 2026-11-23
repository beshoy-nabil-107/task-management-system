const Joi = require("joi");

const createMilestoneSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required().messages({
    "string.empty": "Milestone title is required",
    "string.min": "Milestone title must be at least 2 characters",
    "string.max": "Milestone title cannot exceed 150 characters",
    "any.required": "Milestone title is required",
  }),
  description: Joi.string().trim().allow("", null).optional(),
  due_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Due date must be in YYYY-MM-DD format",
    }),
});

const updateMilestoneSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().allow("", null).optional(),
  due_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Due date must be in YYYY-MM-DD format",
    }),
}).min(1).messages({
  "object.min": "At least one field must be provided to update milestone",
});

module.exports = {
  createMilestoneSchema,
  updateMilestoneSchema,
};
