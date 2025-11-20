const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { protect, isAdmin, isStudent, isAuthorizedToUpdate, isAuthorizedToDelete } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Student Routes
router.post('/', protect, isStudent, upload.single('image'), complaintController.createComplaint);
router.get('/student', protect, isStudent, complaintController.getStudentComplaints);

// Admin Routes
router.get('/', protect, isAdmin, complaintController.getAllComplaints);
router.get('/stats', protect, isAdmin, complaintController.getComplaintStats);

// Department Route
router.get('/department', protect, complaintController.getDepartmentComplaints);

// Unified Update Route
router.put('/:id', protect, isAuthorizedToUpdate, complaintController.updateComplaint);

// Delete Route
//router.delete('/:id', protect, isAuthorizedToDelete, complaintController.deleteComplaint);

// --- NEW UPVOTE ROUTE ---
// Any logged-in user can upvote a complaint
router.post('/:id/upvote', protect, complaintController.toggleUpvote);

module.exports = router;