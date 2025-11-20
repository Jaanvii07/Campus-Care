const Complaint = require('../models/complaint.model');
const User = require('../models/user.model');
const Upvote = require('../models/upvote.model');
const sendEmail = require('../utils/email');
const { Sequelize } = require('sequelize');

// Helper function to format complaint data
const formatComplaints = (complaints, userId) => {
  return complaints.map(c => {
    const complaintJSON = c.toJSON();
    const upvotes = complaintJSON.Upvotes || [];
    const hasUpvoted = upvotes.some(upvote => upvote.userId === userId);
    delete complaintJSON.Upvotes; 
    return { ...complaintJSON, upvoteCount: upvotes.length, hasUpvoted };
  });
};

/**
 * Creates a new complaint, assigns it directly, and notifies student and department.
 */
exports.createComplaint = async (req, res) => {
    try {
        const { title, description, department, location } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        if (!department || !location) {
             return res.status(400).json({ message: "Department and Location are required." });
        }

        const complaint = await Complaint.create({
            title,
            description,
            imageUrl,
            department,
            location,
            status: 'in-progress', // Set status immediately
            studentId: req.user.id
        });

        // 1. Send Email to Student
        const student = await User.findByPk(req.user.id);
        if (student) {
            const emailHtml = `<h2>Complaint Received</h2><p>Hi there,</p><p>Your complaint "<b>${title}</b>" for location "<b>${location}</b>" has been successfully submitted and sent to the <b>${department}</b> department.</p><p>Thank you,<br/>CampusCare Team</p>`;
            await sendEmail({
                to: student.email,
                subject: `Your complaint has been submitted: ${title}`,
                html: emailHtml
            });
        }

        // 2. Send Email to Department
        const departmentUser = await User.findOne({ where: { department: department }});
        if (departmentUser) {
            const departmentHtml = `<h2>New Task Assigned</h2><p>A new task titled "<b>${title}</b>" for location "<b>${location}</b>" has been assigned to your department.</p><p>Please log in to the dashboard to view details.</p>`;
             await sendEmail({
                to: departmentUser.email,
                subject: `New Task: ${title}`,
                html: departmentHtml
            });
        }

        const newComplaintWithDetails = await Complaint.findByPk(complaint.id, {
             include: { model: User, as: 'student', attributes: ['email'] }
        });
        res.status(201).json(newComplaintWithDetails);
    } catch (error) {
        console.error("Error creating complaint:", error);
        res.status(500).json({ message: "Failed to create complaint", error: error.message });
    }
};

/**
 * Updates a complaint's status (Resolve or Admin adds notes).
 */
exports.updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNotes, assignmentNotes } = req.body;

        const complaint = await Complaint.findByPk(id, {
            include: { model: User, as: 'student', attributes: ['email'] }
        });
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        let updateObject = {};
        if (status) updateObject.status = status;
        if (resolutionNotes) updateObject.resolutionNotes = resolutionNotes;
        if (assignmentNotes) updateObject.assignmentNotes = assignmentNotes; 

        await complaint.update(updateObject);

        const studentEmail = complaint.student.email;

        if (status === 'resolved') {
             const studentHtml = `<h2>Your Complaint has been Resolved</h2><p>Your complaint "<b>${complaint.title}</b>" at location "<b>${complaint.location}</b>" has been marked as resolved.</p>${resolutionNotes ? `<p><b>Resolution Notes:</b> ${resolutionNotes}</p>` : ''}<p>Thank you!</p>`;
             await sendEmail({
                to: studentEmail,
                subject: `Resolved: ${complaint.title}`,
                html: studentHtml
            });
        }

        res.status(200).json(complaint);
    } catch (error) {
        console.error("Error updating complaint:", error);
        res.status(500).json({ message: "Failed to update complaint", error: error.message });
    }
};

/**
 * Fetches all complaints for the admin dashboard.
 */
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll({
            include: [
                { model: User, as: 'student', attributes: ['email'] },
                { model: Upvote, attributes: ['userId'] } 
            ],
            order: [['createdAt', 'DESC']]
        });
        const formattedComplaints = formatComplaints(complaints, req.user.id);
        res.status(200).json(formattedComplaints);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
    }
};

/**
 * Fetches complaints only for the currently logged-in student.
 */
exports.getStudentComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll({
            where: { studentId: req.user.id },
            include: [
                { model: Upvote, attributes: ['userId'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        const formattedComplaints = formatComplaints(complaints, req.user.id);
        res.status(200).json(formattedComplaints);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch student complaints", error: error.message });
    }
};

/**
 * Fetches complaints assigned to the currently logged-in department user.
 */
exports.getDepartmentComplaints = async (req, res) => {
    if (req.user.role !== 'department') {
        return res.status(403).json({ message: 'Not authorized as department staff' });
    }
    try {
        const complaints = await Complaint.findAll({
            where: { department: req.user.department },
            include: [
                { model: User, as: 'student', attributes: ['email'] },
                { model: Upvote, attributes: ['userId'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        const formattedComplaints = formatComplaints(complaints, req.user.id);
        res.status(200).json(formattedComplaints);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch department complaints", error: error.message });
    }
};

/**
 * Deletes a complaint from the database.
 */
exports.deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findByPk(id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (req.user.role !== 'admin' && complaint.studentId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        
        // Before deleting complaint, delete associated upvotes
        await Upvote.destroy({ where: { complaintId: id } });
        
        await complaint.destroy();
        res.status(200).json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete complaint", error: error.message });
    }
};

/**
 * Calculates and returns statistics for the admin analytics dashboard.
 */
exports.getComplaintStats = async (req, res) => {
    try {
        const allComplaints = await Complaint.findAll();
        const totalComplaints = allComplaints.length;
        const statusCounts = { 'in-progress': 0, resolved: 0 };
        const departmentCounts = {};

        for (const complaint of allComplaints) {
            if (complaint.status in statusCounts) statusCounts[complaint.status]++;
            if (complaint.department) {
                departmentCounts[complaint.department] = (departmentCounts[complaint.department] || 0) + 1;
            }
        }
        
        const formattedDepartmentCounts = Object.entries(departmentCounts).map(([name, count]) => ({
            name, count
        }));

        const stats = {
            total: totalComplaints,
            statusCounts: statusCounts,
            departmentCounts: formattedDepartmentCounts
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch complaint statistics" });
    }
};

/**
 * Toggles an upvote on a complaint.
 */
exports.toggleUpvote = async (req, res) => {
    try {
        const { id: complaintId } = req.params;
        const { id: userId } = req.user;

        const existingUpvote = await Upvote.findOne({
            where: {
                complaintId: complaintId,
                userId: userId
            }
        });

        if (existingUpvote) {
            await existingUpvote.destroy();
            res.status(200).json({ message: 'Upvote removed' });
        } else {
            await Upvote.create({
                complaintId: complaintId,
                userId: userId
            });
            res.status(200).json({ message: 'Upvote added' });
        }
    } catch (error) {
        console.error("Error toggling upvote:", error);
        res.status(500).json({ message: "Failed to toggle upvote", error: error.message });
    }
};