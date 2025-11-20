const sequelize = require('../config/database');
const User = require('./user.model');
const Complaint = require('./complaint.model');
const Upvote = require('./upvote.model');

// 1. User <-> Complaint (One-to-Many)
// A User (student) can have many complaints
User.hasMany(Complaint, { foreignKey: 'studentId' });
// A Complaint belongs to one User
Complaint.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// 2. User <-> Upvote (One-to-Many)
// A User can have many upvotes
User.hasMany(Upvote, { foreignKey: 'userId' });
Upvote.belongsTo(User, { foreignKey: 'userId' });

// 3. Complaint <-> Upvote (One-to-Many)
// A Complaint can have many upvotes
Complaint.hasMany(Upvote, { foreignKey: 'complaintId' });
Upvote.belongsTo(Complaint, { foreignKey: 'complaintId' });

// Export all models and the connection
module.exports = {
  sequelize,
  User,
  Complaint,
  Upvote
};