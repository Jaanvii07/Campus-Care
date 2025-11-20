const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// --- NEW PUBLIC ROUTE FOR STUDENTS ---
router.post('/register/student', authController.studentRegister);

// --- ADMIN-ONLY ROUTE (for User Management page) ---
router.post('/register', protect, isAdmin, authController.register);
// Role-specific login routes
router.post('/login/student', authController.studentLogin);
router.post('/login/admin', authController.adminLogin);
router.post('/login/department', authController.departmentLogin);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;