const Joi = require("joi");

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "Task title is required",
    "string.min": "Task title must be at least 2 characters",
    "string.max": "Task title cannot exceed 200 characters",
    "any.required": "Task title is required",
  }),
  description: Joi.string().trim().allow("", null).optional(),
  priority: Joi.string()
    .valid("Low", "Medium", "High")
    .default("Medium")
    .optional(),
  deadline: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Deadline must be in YYYY-MM-DD format",
      "any.required": "Task deadline is required",
    }),
  team_id: Joi.number().integer().positive().allow(null).optional(),
  assigned_to: Joi.number().integer().positive().allow(null).optional(),
  milestone_id: Joi.number().integer().positive().allow(null).optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().trim().allow("", null).optional(),
  priority: Joi.string().valid("Low", "Medium", "High").optional(),
  deadline: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      "string.pattern.base": "Deadline must be in YYYY-MM-DD format",
    }),
  team_id: Joi.number().integer().positive().allow(null).optional(),
  assigned_to: Joi.number().integer().positive().allow(null).optional(),
  milestone_id: Joi.number().integer().positive().allow(null).optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided to update the task",
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "In Progress", "PendingReview", "Delayed", "Completed")
    .required()
    .messages({
      "any.only": "Status must be one of 'Pending', 'In Progress', 'PendingReview', 'Delayed', or 'Completed'",
      "any.required": "Status is required",
    }),
});

const reviewTaskSchema = Joi.object({
  decision: Joi.string().valid("approve", "reject").required().messages({
    "any.only": "Decision must be either 'approve' or 'reject'",
    "any.required": "Review decision is required",
  }),
  quality_rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .when("decision", {
      is: "approve",
      then: Joi.required().messages({
        "any.required": "Quality rating (1-5) is required when approving a task",
      }),
      otherwise: Joi.optional().allow(null),
    }),
  review_feedback: Joi.string()
    .trim()
    .when("decision", {
      is: "reject",
      then: Joi.string().min(3).required().messages({
        "any.required": "Review feedback is required when rejecting a task",
        "string.empty": "Review feedback cannot be empty when rejecting a task",
      }),
      otherwise: Joi.string().allow("", null).optional(),
    }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  reviewTaskSchema,
};
