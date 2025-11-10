const jwt = require('jsonwebtoken');
const Complaint = require('../models/complaint.model');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Adds { id, role, department } to the request
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
    return next(); // Admins can always update
  }
  if (req.user.role === 'department') {
    try {
      const complaint = await Complaint.findByPk(req.params.id);
      // Check if the complaint's department matches the user's department
      if (complaint && complaint.department === req.user.department) {
        return next();
      }
    } catch (error) {
        return res.status(500).json({ message: 'Error during authorization check' });
    }
  }
  // If not admin or the correct department, deny access
  return res.status(403).json({ message: 'Not authorized to perform this action' });
};

module.exports = { protect, isAdmin, isStudent, isAuthorizedToUpdate };