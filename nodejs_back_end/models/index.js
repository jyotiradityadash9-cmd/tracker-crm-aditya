const User = require('./User');
const Lead = require('./Lead');
const FollowUp = require('./FollowUp');
const Proposal = require('./Proposal');
const ProposalItem = require('./ProposalItem');

// Associations
User.hasMany(Lead, { foreignKey: 'assignedToUserId', as: 'leads' });
Lead.belongsTo(User, { foreignKey: 'assignedToUserId', as: 'assignedUser' });

Lead.hasMany(FollowUp, { foreignKey: 'leadId', as: 'followUps', onDelete: 'CASCADE' });
FollowUp.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });

Lead.hasMany(Proposal, { foreignKey: 'leadId', as: 'proposals', onDelete: 'RESTRICT' });
Proposal.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });

Proposal.hasMany(ProposalItem, { foreignKey: 'proposalId', as: 'items', onDelete: 'CASCADE' });
ProposalItem.belongsTo(Proposal, { foreignKey: 'proposalId', as: 'proposal' });

module.exports = {
  User,
  Lead,
  FollowUp,
  Proposal,
  ProposalItem
};
