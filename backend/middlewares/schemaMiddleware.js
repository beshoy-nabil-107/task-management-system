function validateSchema(schema) {
  return function (request, response, next) {
    const { error, value } = schema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message);
      return response.status(400).jsend.error({
        code: 400,
        message: details.join("; "),
        data: details,
      });
    }

    request.body = value;
    next();
  };
}

module.exports = {
  validateSchema,
};
