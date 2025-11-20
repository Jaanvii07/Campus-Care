const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('student', 'admin', 'department'),
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true
});

// All relationships are now handled in /models/index.js

module.exports = User;