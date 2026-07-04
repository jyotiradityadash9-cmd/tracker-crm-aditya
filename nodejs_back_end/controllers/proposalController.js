const { Proposal, ProposalItem, Lead, FollowUp, sequelize } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');

// Get all proposals (with search, pagination, filter)
exports.getProposals = async (req, res) => {
  try {
    const { page = 1, size = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status, downloadPdf } = req.query;

    const limit = parseInt(size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { proposalNumber: { [Op.like]: `%${search}%` } },
        { '$lead.leadName$': { [Op.like]: `%${search}%` } },
        { '$lead.companyName$': { [Op.like]: `%${search}%` } }
      ];
    }

    const order = [[sortBy, sortOrder]];

    // PDF Download handling
    if (downloadPdf === 'true') {
      const proposals = await Proposal.findAll({
        where,
        order,
        include: [{ model: Lead, as: 'lead', attributes: ['leadName', 'companyName'] }]
      });

      const headers = [
        { label: 'Proposal No', width: 100 },
        { label: 'Lead Name', width: 100 },
        { label: 'Company', width: 100 },
        { label: 'Date', width: 70 },
        { label: 'Status', width: 70 },
        { label: 'Grand Total ($)', width: 100 }
      ];

      const rows = proposals.map(p => [
        p.proposalNumber,
        p.lead?.leadName || 'N/A',
        p.lead?.companyName || 'N/A',
        p.proposalDate,
        p.status,
        p.grandTotal
      ]);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=proposals_report.pdf');
      return pdfService.generateTablePDF(res, 'Proposals Export Report', headers, rows);
    }

    const { count, rows } = await Proposal.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'leadName', 'companyName'] }
      ]
    });

    res.json({
      totalItems: count,
      proposals: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get proposal by ID
exports.getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id, {
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'leadName', 'companyName', 'status'] },
        { model: ProposalItem, as: 'items' }
      ]
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create proposal
exports.createProposal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { leadId, proposalDate, validTill, discountPercent = 0, notes, items = [] } = req.body;

    if (!leadId || !proposalDate || !validTill || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'LeadId, ProposalDate, ValidTill, and items are required' });
    }

    // Lead rule: Proposal can only be created for leads in Qualified or Contacted status
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (lead.status !== 'Qualified' && lead.status !== 'Contacted') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Proposals can only be created for leads with Qualified or Contacted status.' });
    }

    // Calculate totals
    let subTotal = 0;
    const itemsData = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      subTotal += lineTotal;
      return {
        serviceName: item.serviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal
      };
    });

    const discountAmount = (subTotal * discountPercent) / 100;
    const grandTotal = subTotal - discountAmount;

    // Generate Proposal Number (e.g. PROP-YYYYMMDD-RANDOM)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const proposalNumber = `PROP-${proposalDate.replace(/-/g, '')}-${randomSuffix}`;

    const proposal = await Proposal.create({
      proposalNumber,
      leadId,
      proposalDate,
      validTill,
      status: 'Draft',
      discountPercent,
      subTotal,
      grandTotal,
      notes
    }, { transaction });

    // Bulk create items with proposal association
    const itemRecords = itemsData.map(item => ({
      ...item,
      proposalId: proposal.id
    }));

    await ProposalItem.bulkCreate(itemRecords, { transaction });

    await transaction.commit();

    // Fetch newly created proposal with items to return
    const createdProposal = await Proposal.findByPk(proposal.id, {
      include: [{ model: ProposalItem, as: 'items' }]
    });

    res.status(201).json(createdProposal);

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating proposal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Edit draft proposal
exports.updateProposal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { proposalDate, validTill, discountPercent, notes, items } = req.body;

    const proposal = await Proposal.findByPk(id, {
      include: [{ model: ProposalItem, as: 'items' }]
    });

    if (!proposal) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.status !== 'Draft') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Only draft proposals can be edited' });
    }

    let subTotal = proposal.subTotal;
    let discPct = discountPercent !== undefined ? discountPercent : proposal.discountPercent;

    if (items) {
      // Re-calculate
      subTotal = 0;
      const itemsData = items.map(item => {
        const lineTotal = item.quantity * item.unitPrice;
        subTotal += lineTotal;
        return {
          serviceName: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
          proposalId: proposal.id
        };
      });

      // Clear existing items and insert new ones
      await ProposalItem.destroy({ where: { proposalId: proposal.id }, transaction });
      await ProposalItem.bulkCreate(itemsData, { transaction });
    }

    const discountAmount = (subTotal * discPct) / 100;
    const grandTotal = subTotal - discountAmount;

    await proposal.update({
      proposalDate: proposalDate || proposal.proposalDate,
      validTill: validTill || proposal.validTill,
      discountPercent: discPct,
      subTotal,
      grandTotal,
      notes: notes !== undefined ? notes : proposal.notes
    }, { transaction });

    await transaction.commit();

    const updatedProposal = await Proposal.findByPk(id, {
      include: [{ model: ProposalItem, as: 'items' }]
    });

    res.json(updatedProposal);

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating proposal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit proposal
exports.submitProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.status !== 'Draft') {
      return res.status(400).json({ message: 'Proposal must be in Draft status to submit.' });
    }

    // Check approval rules
    // Rule: If DiscountPercent > 20 or GrandTotal > 500,000, proposal requires admin approval
    const requiresAdminApproval = parseFloat(proposal.discountPercent) > 20 || parseFloat(proposal.grandTotal) > 500000;

    if (requiresAdminApproval) {
      await proposal.update({ status: 'Submitted' }); // Stays submitted until admin acts
      res.json({ message: 'Proposal submitted. Requires admin approval due to discount or deal size.', proposal });
    } else {
      // Auto-approve since no rules triggered
      await proposal.update({ status: 'Approved' });
      // When a proposal is approved, related lead status should become Converted
      const lead = await Lead.findByPk(proposal.leadId);
      if (lead) {
        await lead.update({ status: 'Converted' });
      }
      res.json({ message: 'Proposal submitted and automatically approved.', proposal });
    }

  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin approve proposal
exports.approveProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.status !== 'Submitted') {
      return res.status(400).json({ message: 'Only submitted proposals can be approved.' });
    }

    await proposal.update({ status: 'Approved' });

    // When approved, related lead status becomes Converted
    const lead = await Lead.findByPk(proposal.leadId);
    if (lead) {
      await lead.update({ status: 'Converted' });
    }

    res.json({ message: 'Proposal approved successfully.', proposal });
  } catch (error) {
    console.error('Error approving proposal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin reject proposal
exports.rejectProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.status !== 'Submitted') {
      return res.status(400).json({ message: 'Only submitted proposals can be rejected.' });
    }

    await proposal.update({ status: 'Rejected' });

    res.json({ message: 'Proposal rejected successfully.', proposal });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Generate AI summary
exports.generateAiSummary = async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id, {
      include: [{ model: ProposalItem, as: 'items' }]
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const lead = await Lead.findByPk(proposal.leadId);
    const followUps = await FollowUp.findAll({
      where: { leadId: proposal.leadId },
      order: [['followUpDate', 'DESC']]
    });

    const result = await aiService.generateProposalSummary(proposal, lead, followUps);

    // Save summary and recommendation
    await proposal.update({
      aiSummary: result.summary,
      aiRecommendation: result.recommendation
    });

    res.json({
      aiSummary: result.summary,
      aiRecommendation: result.recommendation
    });
  } catch (error) {
    console.error('Error generating AI Summary endpoint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
