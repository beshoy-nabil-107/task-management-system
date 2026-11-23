const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function authMiddleware(request, response, next) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).jsend.error({
        code: 401,
        message: "Authentication required. Bearer token missing or malformed.",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return response.status(401).jsend.error({
        code: 401,
        message: "Token is invalid or has expired.",
      });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return response.status(401).jsend.error({
        code: 401,
        message: "User account associated with this token no longer exists.",
      });
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
