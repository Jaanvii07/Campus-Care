const User = require('../models/user.model');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        // Find all users but exclude their password for security
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent an admin from deleting themselves
        if (req.user.id.toString() === id) {
            return res.status(400).json({ message: "Admin cannot delete their own account." });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        await user.destroy();
        res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
};