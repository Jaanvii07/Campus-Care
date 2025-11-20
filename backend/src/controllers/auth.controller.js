const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// This helper function creates the token and cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user.id, role: user.role, department: user.department },
    process.env.JWT_SECRET, { expiresIn: '1d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.status(statusCode).json({
    token: token, // We send the token to store in localStorage for the auth guards
    role: user.role,
    message: "Login successful"
  });
};

// --- PUBLIC REGISTRATION FUNCTION FOR STUDENTS ---
exports.studentRegister = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // --- THIS IS THE NEW, SIMPLER FIX ---
    // Check if the email is a special admin email
    let role = 'student';
    if (email.endsWith('@admin.campus')) {
        role = 'admin';
        console.log(`*** Admin account created for ${email} ***`);
    }
    // --- END FIX ---

    const user = await User.create({
      email,
      password: hashedPassword,
      role: role // Use the role we just determined
    });

    res.status(201).json({ message: "Account created successfully. Please login.", userId: user.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "User with this email already exists." });
    }
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};


// --- ADMIN-ONLY REGISTRATION (for User Management page) ---
exports.register = async (req, res) => {
  const { email, password, role, department } = req.body;
  if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      department: role === 'department' ? department : null
    });
    res.status(201).json({ message: "User created successfully.", userId: user.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "User with this email already exists." });
    }
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};


// --- SEPARATE LOGIN FUNCTIONS ---

exports.studentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== 'student') return res.status(403).json({ message: "Access denied. Not a student account." });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== 'admin') return res.status(403).json({ message: "Access denied. Not an admin account." });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

exports.departmentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== 'department') return res.status(403).json({ message: "Access denied. Not a department account." });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// @desc    Logout user
exports.logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
};