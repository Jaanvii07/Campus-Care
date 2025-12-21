const Complaint = require('../models/complaint.model');
const User = require('../models/user.model');
const Upvote = require('../models/upvote.model');
const sendEmail = require('../utils/email');
const { Sequelize } = require('sequelize');

// Helper to format complaints
const formatComplaints = (complaints, userId) => {
  return complaints.map(c => {
    const complaintJSON = c.toJSON();
    const upvotes = complaintJSON.Upvotes || [];
    const hasUpvoted = upvotes.some(upvote => upvote.userId === userId);
    delete complaintJSON.Upvotes; 
    return { ...complaintJSON, upvoteCount: upvotes.length, hasUpvoted };
  });
};

exports.createComplaint = async (req, res) => {
    try {
        const { title, description, department, location, imageUrl } = req.body;

        if (!department || !location) {
            return res.status(400).json({ message: "Required fields missing." });
        }

        // 1. Create the Complaint (Fast)
        const complaint = await Complaint.create({
            title, 
            description, 
            imageUrl: imageUrl || null, 
            department, 
            location, 
            status: 'in-progress', 
            studentId: req.user.id
        });

        // 2. Fetch User Details (Fast)
        const student = await User.findByPk(req.user.id);
        const departmentUser = await User.findOne({ where: { department: department }});

        // 3. Send Emails in BACKGROUND (Don't wait for them!)
        // notice we REMOVED 'await' here
        if (student) {
            sendEmail({
                to: student.email,
                subject: `Complaint Submitted: ${title}`,
                html: `<p>Your complaint for <b>${location}</b> has been sent to <b>${department}</b>.</p>`
            }).catch(err => console.error("Student email failed:", err)); 
        }

        if (departmentUser) {
             sendEmail({
                to: departmentUser.email,
                subject: `New Task: ${title}`,
                html: `<p>New task at <b>${location}</b>.</p>`
            }).catch(err => console.error("Dept email failed:", err));
        }

        // 4. Send Response Immediately
        const newComplaint = await Complaint.findByPk(complaint.id, {
             include: { model: User, as: 'student', attributes: ['email'] }
        });
        
        res.status(201).json({ ...newComplaint.toJSON(), upvoteCount: 0, hasUpvoted: false });

    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ message: "Failed to create complaint", error: error.message });
    }
};

exports.updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNotes, assignmentNotes } = req.body;
        const complaint = await Complaint.findByPk(id, { include: { model: User, as: 'student', attributes: ['email'] } });
        if (!complaint) return res.status(404).json({ message: 'Not found' });

        await complaint.update({ status, resolutionNotes, assignmentNotes });

        if (status === 'resolved') {
             await sendEmail({ to: complaint.student.email, subject: `Resolved: ${complaint.title}`, html: `<p>Your complaint is resolved.</p>` });
        }
        res.status(200).json(complaint);
    } catch (error) { res.status(500).json({ message: "Error updating" }); }
};

exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll({
            include: [{ model: User, as: 'student', attributes: ['email'] }, { model: Upvote, attributes: ['userId'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(formatComplaints(complaints, req.user.id));
    } catch (error) { res.status(500).json({ message: "Error fetching complaints" }); }
};

exports.getStudentComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll({
            where: { studentId: req.user.id },
            include: [{ model: Upvote, attributes: ['userId'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(formatComplaints(complaints, req.user.id));
    } catch (error) { res.status(500).json({ message: "Error fetching complaints" }); }
};

// --- NEW: Public complaints for community feed ---
exports.getPublicComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll({
            where: { status: 'in-progress' },
            include: [{ model: Upvote, attributes: ['userId'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(formatComplaints(complaints, req.user.id));
    } catch (error) { res.status(500).json({ message: "Error fetching public complaints" }); }
};

exports.getDepartmentComplaints = async (req, res) => {
    if (req.user.role !== 'department') return res.status(403).json({ message: 'Not authorized' });
    try {
        const complaints = await Complaint.findAll({
            where: { department: req.user.department },
            include: [{ model: User, as: 'student', attributes: ['email'] }, { model: Upvote, attributes: ['userId'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(formatComplaints(complaints, req.user.id));
    } catch (error) { res.status(500).json({ message: "Error fetching complaints" }); }
};

// --- THIS WAS LIKELY MISSING ---
exports.deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findByPk(id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (req.user.role !== 'admin' && complaint.studentId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        
        await Upvote.destroy({ where: { complaintId: id } });
        await complaint.destroy();
        res.status(200).json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ message: "Error deleting" }); }
};

exports.getComplaintStats = async (req, res) => {
    try {
        const allComplaints = await Complaint.findAll();
        const total = allComplaints.length;
        const statusCounts = { 'in-progress': 0, resolved: 0 };
        const departmentCounts = {};
        for (const c of allComplaints) {
            if (c.status in statusCounts) statusCounts[c.status]++;
            if (c.department) departmentCounts[c.department] = (departmentCounts[c.department] || 0) + 1;
        }
        const formattedDept = Object.entries(departmentCounts).map(([name, count]) => ({ name, count }));
        res.status(200).json({ total, statusCounts, departmentCounts: formattedDept });
    } catch (error) { res.status(500).json({ message: "Error stats" }); }
};

exports.toggleUpvote = async (req, res) => {
    try {
        const { id: complaintId } = req.params;
        const { id: userId } = req.user;
        const existing = await Upvote.findOne({ where: { complaintId, userId } });
        if (existing) { await existing.destroy(); res.status(200).json({ message: 'Removed' }); } 
        else { await Upvote.create({ complaintId, userId }); res.status(200).json({ message: 'Added' }); }
    } catch (error) { res.status(500).json({ message: "Error upvote" }); }
};