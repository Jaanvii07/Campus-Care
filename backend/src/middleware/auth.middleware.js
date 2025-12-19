const jwt = require('jsonwebtoken');
const Complaint = require('../models/complaint.model');

const protect = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Not authorized as an admin' });
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  res.status(403).json({ message: 'Not authorized as a student' });
};

const isAuthorizedToUpdate = async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  if (req.user.role === 'department') {
    try {
      const complaint = await Complaint.findByPk(req.params.id);
      if (complaint && complaint.department === req.user.department) {
        return next();
      }
    } catch (error) {
        return res.status(500).json({ message: 'Error during authorization check' });
    }
  }
  return res.status(403).json({ message: 'Not authorized to perform this action' });
};

// --- THIS IS LIKELY THE MISSING FUNCTION ---
const isAuthorizedToDelete = async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
    }
    if (complaint.studentId === req.user.id) {
      return next();
    }
    return res.status(403).json({ message: 'Not authorized to delete this complaint' });
  } catch(error) {
    return res.status(500).json({ message: 'Error during delete authorization' });
  }
};

module.exports = { protect, isAdmin, isStudent, isAuthorizedToUpdate, isAuthorizedToDelete };