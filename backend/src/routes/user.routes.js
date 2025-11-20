const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// All routes in this file are protected and can only be used by a logged-in Admin
router.use(protect, isAdmin);

// GET /api/users - Fetches all users
router.get('/', userController.getAllUsers);

// DELETE /api/users/:id - Deletes a specific user
router.delete('/:id', userController.deleteUser);

module.exports = router;