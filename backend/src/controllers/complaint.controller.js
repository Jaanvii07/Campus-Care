const Complaint = require('../models/complaint.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/email');
const { Sequelize } = require('sequelize');

/**
 * Creates a new complaint, saves image and location, and sends email.
 */
exports.createComplaint = async (req, res) => {
    try {
        // Get location data from the request body
        const { title, description, latitude, longitude } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const complaint = await Complaint.create({
            title,
            description,
            imageUrl,
            latitude,  // Save latitude
            longitude, // Save longitude
            studentId: req.user.id
        });

        const student = await User.findByPk(req.user.id);
        if (student) {
            const emailHtml = `<h2>Complaint Received</h2><p>Hi there,</p><p>We have successfully received your complaint titled "<b>${title}</b>".</p><p>We will notify you once an administrator reviews it.</p>`;
            await sendEmail({ to: student.email, subject: `Complaint Received: ${title}`, html: emailHtml });
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
 * Updates a complaint's status and sends email notifications.
 */
exports.updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, department, resolutionNotes, rejectionReason } = req.body;

        const complaint = await Complaint.findByPk(id, {
            include: { model: User, as: 'student', attributes: ['email'] }
        });
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        await complaint.update(req.body);

        const studentEmail = complaint.student.email;

        // --- Notification Logic ---
        if (status === 'in-progress' && department) {
            const studentHtml = `<h2>Your Complaint is In Progress</h2><p>Your complaint "<b>${complaint.title}</b>" has been assigned to the <b>${department}</b> department.</p>`;
            await sendEmail({ to: studentEmail, subject: `Update on your complaint: ${complaint.title}`, html: studentHtml });
            const departmentUser = await User.findOne({ where: { department: department }});
            if (departmentUser) {
                const departmentHtml = `<h2>New Task Assigned</h2><p>A new task titled "<b>${complaint.title}</b>" has been assigned to your department.</p>`;
                 await sendEmail({ to: departmentUser.email, subject: `New Task: ${complaint.title}`, html: departmentHtml });
            }
        } else if (status === 'resolved') {
             const studentHtml = `<h2>Your Complaint has been Resolved</h2><p>Your complaint "<b>${complaint.title}</b>" has been marked as resolved.</p>${resolutionNotes ? `<p><b>Resolution Notes:</b> ${resolutionNotes}</p>` : ''}`;
             await sendEmail({ to: studentEmail, subject: `Resolved: ${complaint.title}`, html: studentHtml });
        } else if (status === 'rejected') {
            const studentHtml = `<h2>Your Complaint Has Been Reviewed</h2><p>Your complaint "<b>${complaint.title}</b>" was rejected.</p>${rejectionReason ? `<p><b>Reason:</b> ${rejectionReason}</p>` : ''}`;
            await sendEmail({ to: studentEmail, subject: `Update on your complaint: ${complaint.title}`, html: studentHtml });
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
            include: { model: User, as: 'student', attributes: ['email'] },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(complaints);
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
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(complaints);
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
            include: { model: User, as: 'student', attributes: ['email'] },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(complaints);
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
        const statusCounts = {
            pending: 0, 'in-progress': 0, resolved: 0, rejected: 0,
        };
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