const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  proposalNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  proposalDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  validTill: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
    allowNull: false,
    defaultValue: 'Draft',
  },
  discountPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  subTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  grandTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  aiSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  aiRecommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'proposals',
});

module.exports = Proposal;
