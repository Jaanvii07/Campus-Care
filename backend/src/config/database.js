const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './campus_care.sqlite',
  logging: false
});

module.exports = sequelize;