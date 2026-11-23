const Joi = require("joi");

const createExtensionSchema = Joi.object({
  task_id: Joi.number().integer().positive().required().messages({
    "number.base": "Task ID must be a valid number",
    "any.required": "Task ID is required",
  }),
  requested_deadline: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Requested deadline must be in YYYY-MM-DD format",
      "any.required": "Requested deadline is required",
    }),
  reason: Joi.string().trim().min(5).required().messages({
    "string.empty": "Reason is required",
    "string.min": "Reason must be at least 5 characters long",
    "any.required": "Reason is required",
  }),
});

const reviewExtensionSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected").required().messages({
    "any.only": "Status must be either 'Approved' or 'Rejected'",
    "any.required": "Review status is required",
  }),
});

module.exports = {
  createExtensionSchema,
  reviewExtensionSchema,
};
