function authorizeRoles(...allowedRoles) {
  return function (request, response, next) {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return response.status(403).jsend.error({
        code: 403,
        message: "Access forbidden: insufficient role permissions.",
      });
    }
    next();
  };
}

module.exports = {
  authorizeRoles,
};
