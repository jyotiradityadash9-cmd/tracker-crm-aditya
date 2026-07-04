const { FollowUp, Lead } = require('../models');

// Helper function to update lead status based on follow-up outcome
const updateLeadStatusBasedOnOutcome = async (leadId, outcome) => {
  if (!outcome) return;

  const lead = await Lead.findByPk(leadId);
  if (!lead) return;

  if (outcome.toLowerCase() === 'interested') {
    await lead.update({ status: 'Qualified' });
  } else if (outcome.toLowerCase() === 'not interested') {
    await lead.update({ status: 'Lost' });
  } else {
    // If we've made contact but not interested/lost, we can set to Contacted if it was New
    if (lead.status === 'New') {
      await lead.update({ status: 'Contacted' });
    }
  }
};

// Get follow-ups for a specific lead
exports.getFollowUpsByLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const followUps = await FollowUp.findAll({
      where: { leadId },
      order: [['followUpDate', 'DESC'], ['id', 'DESC']]
    });
    res.json(followUps);
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add follow-up to a lead
exports.createFollowUp = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { followUpDate, followUpType, notes, outcome, nextFollowUpDate } = req.body;

    if (!followUpDate || !followUpType) {
      return res.status(400).json({ message: 'FollowUpDate and FollowUpType are required' });
    }

    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const followUp = await FollowUp.create({
      leadId: parseInt(leadId, 10),
      followUpDate,
      followUpType,
      notes,
      outcome,
      nextFollowUpDate
    });

    // Run business rule to auto update lead status
    await updateLeadStatusBasedOnOutcome(leadId, outcome);

    res.status(201).json(followUp);
  } catch (error) {
    console.error('Error creating followup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Edit follow-up
exports.updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpDate, followUpType, notes, outcome, nextFollowUpDate } = req.body;

    const followUp = await FollowUp.findByPk(id);
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    await followUp.update({
      followUpDate: followUpDate || followUp.followUpDate,
      followUpType: followUpType || followUp.followUpType,
      notes: notes !== undefined ? notes : followUp.notes,
      outcome: outcome !== undefined ? outcome : followUp.outcome,
      nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : followUp.nextFollowUpDate
    });

    // Run business rule to auto update lead status
    await updateLeadStatusBasedOnOutcome(followUp.leadId, outcome);

    res.json(followUp);
  } catch (error) {
    console.error('Error updating followup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete follow-up
exports.deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const followUp = await FollowUp.findByPk(id);

    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    await followUp.destroy();
    res.json({ message: 'Follow-up deleted successfully' });
  } catch (error) {
    console.error('Error deleting followup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
