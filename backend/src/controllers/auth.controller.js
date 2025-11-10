const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    res.status(201).json({ message: "User created successfully. Please login.", userId: user.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "User with this email already exists." });
    }
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
        { id: user.id, role: user.role, department: user.department },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.status(200).json({ token, role: user.role, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};