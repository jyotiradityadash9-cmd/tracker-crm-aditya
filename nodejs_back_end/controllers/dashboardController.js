const { Lead, Proposal, FollowUp } = require('../models');
const { Op } = require('sequelize');

exports.getSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Total Leads
    const totalLeads = await Lead.count();

    // 2. Qualified Leads
    const qualifiedLeads = await Lead.count({ where: { status: 'Qualified' } });

    // 3. Overdue Follow-ups count
    const overdueFollowUps = await Lead.count({
      where: {
        status: { [Op.in]: ['New', 'Contacted'] }
      },
      include: [{
        model: FollowUp,
        as: 'followUps',
        required: true,
        where: {
          nextFollowUpDate: { [Op.lt]: today }
        }
      }]
    });

    // 4. Submitted Proposals
    const submittedProposals = await Proposal.count({ where: { status: 'Submitted' } });

    // 5. Approved Proposals This Month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const approvedProposalsThisMonth = await Proposal.count({
      where: {
        status: 'Approved',
        proposalDate: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // 6. Trends for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const startTrendDate = new Date();
    startTrendDate.setDate(startTrendDate.getDate() - 7);

    // Lead creations by date
    const leadsByDate = await Lead.findAll({
      attributes: [
        [Lead.sequelize.fn('DATE', Lead.sequelize.col('createdAt')), 'date'],
        [Lead.sequelize.fn('COUNT', Lead.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startTrendDate
        }
      },
      group: [Lead.sequelize.fn('DATE', Lead.sequelize.col('createdAt'))]
    });

    // Follow-ups by date
    const followUpsByDate = await FollowUp.findAll({
      attributes: [
        [FollowUp.sequelize.fn('DATE', FollowUp.sequelize.col('followUpDate')), 'date'],
        [FollowUp.sequelize.fn('COUNT', FollowUp.sequelize.col('id')), 'count']
      ],
      where: {
        followUpDate: {
          [Op.gte]: startTrendDate.toISOString().split('T')[0]
        }
      },
      group: [FollowUp.sequelize.fn('DATE', FollowUp.sequelize.col('followUpDate'))]
    });

    // Map trends
    const leadsTrendMap = {};
    leadsByDate.forEach(item => {
      const rawDate = item.getDataValue('date');
      if (!rawDate) return;
      // Convert raw date to string in case dialect returns a Date object
      const dateStr = typeof rawDate === 'string' 
        ? rawDate 
        : new Date(rawDate).toISOString().split('T')[0];
      leadsTrendMap[dateStr] = parseInt(item.getDataValue('count')) || 0;
    });

    const followUpsTrendMap = {};
    followUpsByDate.forEach(item => {
      const rawDate = item.getDataValue('date');
      if (!rawDate) return;
      const dateStr = typeof rawDate === 'string' 
        ? rawDate 
        : new Date(rawDate).toISOString().split('T')[0];
      followUpsTrendMap[dateStr] = parseInt(item.getDataValue('count')) || 0;
    });

    const trends = last7Days.map(date => ({
      date: date.substring(5), // MM-DD format
      leads: leadsTrendMap[date] || 0,
      followUps: followUpsTrendMap[date] || 0
    }));

    res.json({
      totalLeads,
      qualifiedLeads,
      overdueFollowUps,
      submittedProposals,
      approvedProposalsThisMonth,
      trends
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
