const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function register(request, response) {
  const { name, email, password } = request.body;

  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    return response.status(409).jsend.error({
      code: 409,
      message: "Email is already registered",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userModel.create({
    name,
    email,
    password: hashedPassword,
    role: "member",
  });

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  return response.status(201).jsend.success({
    message: "User registered successfully",
    data: {
      token,
      user: newUser,
    },
  });
}

async function login(request, response) {
  const { email, password } = request.body;

  const user = await userModel.findByEmail(email);
  if (!user) {
    return response.status(401).jsend.error({
      code: 401,
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return response.status(401).jsend.error({
      code: 401,
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  const cleanUser = await userModel.findById(user.id);

  return response.status(200).jsend.success({
    message: "Login successful",
    data: {
      token,
      user: cleanUser,
    },
  });
}

async function myProfile(request, response) {
  return response.status(200).jsend.success({
    message: "Profile retrieved successfully",
    data: request.user,
  });
}

async function updateMyProfile(request, response) {
  const { name, password } = request.body;
  const updateData = {};

  if (name !== undefined && name !== null && name.trim() !== "") {
    updateData.name = name.trim();
  }

  if (password !== undefined && password !== null && password !== "") {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await userModel.updateProfile(request.user.id, updateData);

  return response.status(200).jsend.success({
    message: "Profile updated successfully",
    data: updatedUser,
  });
}

module.exports = {
  register,
  login,
  myProfile,
  updateMyProfile,
};
