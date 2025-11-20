const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
// We no longer import User or Upvote here

const Complaint = sequelize.define('Complaint', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('in-progress', 'resolved'),
    defaultValue: 'in-progress',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  location: { 
    type: DataTypes.STRING,
    allowNull: true, 
  },
  assignmentNotes: { 
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

// All relationships are now handled in /models/index.js

module.exports = Complaint;