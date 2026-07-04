const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProposalItem = sequelize.define('ProposalItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  proposalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  serviceName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  lineTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'proposal_items',
  timestamps: false,
});

module.exports = ProposalItem;
