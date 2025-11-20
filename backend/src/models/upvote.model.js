const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Upvote = sequelize.define('Upvote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  //add foreign keys in the model definitions
});

module.exports = Upvote;