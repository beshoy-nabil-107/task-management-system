const Joi = require("joi");

const teamReportSchema = Joi.object({
  feedback: Joi.string().trim().min(5).required().messages({
    "string.empty": "Feedback cannot be empty",
    "string.min": "Feedback must be at least 5 characters long",
    "any.required": "Feedback is required",
  }),
});

module.exports = {
  teamReportSchema,
};
