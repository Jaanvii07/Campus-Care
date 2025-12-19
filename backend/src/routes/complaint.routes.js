const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { protect, isAdmin, isStudent, isAuthorizedToUpdate, isAuthorizedToDelete } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Student
router.post('/', protect, isStudent, upload.single('image'), complaintController.createComplaint);
router.get('/student', protect, isStudent, complaintController.getStudentComplaints);
router.get('/public', protect, isStudent, complaintController.getPublicComplaints);

// Admin
router.get('/', protect, isAdmin, complaintController.getAllComplaints);
router.get('/stats', protect, isAdmin, complaintController.getComplaintStats);

// Department
router.get('/department', protect, complaintController.getDepartmentComplaints);

// General
router.put('/:id', protect, isAuthorizedToUpdate, complaintController.updateComplaint);
router.delete('/:id', protect, isAuthorizedToDelete, complaintController.deleteComplaint);
router.post('/:id/upvote', protect, complaintController.toggleUpvote);

module.exports = router;