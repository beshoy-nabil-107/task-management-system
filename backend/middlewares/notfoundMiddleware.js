function notfoundMiddleware(request, response, next) {
  return response.status(404).jsend.error({
    code: 404,
    message: "Route not found",
  });
}

module.exports = notfoundMiddleware;
