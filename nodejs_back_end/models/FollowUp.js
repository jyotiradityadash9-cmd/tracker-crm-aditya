const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FollowUp = sequelize.define('FollowUp', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  followUpDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  followUpType: {
    type: DataTypes.ENUM('Call', 'Email', 'Meeting'),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  outcome: {
    type: DataTypes.STRING,
    allowNull: true, // e.g. "Interested", "Not Interested", "No Response", etc.
  },
  nextFollowUpDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'follow_ups',
});

module.exports = FollowUp;
