const { Op } = require('sequelize');
const { Lead, User, Proposal } = require('../models');
const pdfService = require('../services/pdfService');

// Get list of leads (paginated, sorted, filtered, searched)
exports.getLeads = async (req, res) => {
  try {
    const { page = 1, size = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status, source, downloadPdf } = req.query;

    const limit = parseInt(size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    // Build filter/search query
    const where = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where[Op.or] = [
        { leadName: { [Op.like]: `%${search}%` } },
        { companyName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const order = [[sortBy, sortOrder]];

    // If PDF download request, retrieve all matching records and stream pdf
    if (downloadPdf === 'true') {
      const leads = await Lead.findAll({
        where,
        order,
        include: [{ model: User, as: 'assignedUser', attributes: ['name'] }]
      });

      const headers = [
        { label: 'Lead Name', width: 100 },
        { label: 'Company', width: 100 },
        { label: 'Email', width: 120 },
        { label: 'Source', width: 60 },
        { label: 'Status', width: 60 },
        { label: 'Expected Amount ($)', width: 100 }
      ];

      const rows = leads.map(l => [
        l.leadName,
        l.companyName,
        l.email,
        l.source,
        l.status,
        l.expectedDealAmount
      ]);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=leads_report.pdf');
      return pdfService.generateTablePDF(res, 'Leads Export Report', headers, rows);
    }

    // Standard paginated JSON response
    const { count, rows } = await Lead.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
    });

    res.json({
      totalItems: count,
      leads: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10)
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead by id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new lead
exports.createLead = async (req, res) => {
  try {
    const { leadName, companyName, email, phone, source, status, expectedDealAmount, assignedToUserId } = req.body;

    if (!leadName || !companyName || !email || !source) {
      return res.status(400).json({ message: 'Lead Name, Company Name, Email, and Source are required' });
    }

    const lead = await Lead.create({
      leadName,
      companyName,
      email,
      phone,
      source,
      status: status || 'New',
      expectedDealAmount: expectedDealAmount || 0,
      assignedToUserId: assignedToUserId || req.user.id
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Edit a lead
exports.updateLead = async (req, res) => {
  try {
    const { leadName, companyName, email, phone, source, status, expectedDealAmount, assignedToUserId } = req.body;
    const lead = await Lead.findByPk(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await lead.update({
      leadName: leadName || lead.leadName,
      companyName: companyName || lead.companyName,
      email: email || lead.email,
      phone: phone !== undefined ? phone : lead.phone,
      source: source || lead.source,
      status: status || lead.status,
      expectedDealAmount: expectedDealAmount !== undefined ? expectedDealAmount : lead.expectedDealAmount,
      assignedToUserId: assignedToUserId !== undefined ? assignedToUserId : lead.assignedToUserId
    });

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a lead
exports.deleteLead = async (req, res) => {
  try {
    const leadId = req.params.id;
    const lead = await Lead.findByPk(leadId);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Rule: Delete lead should be blocked if a proposal already exists
    const proposalExists = await Proposal.findOne({ where: { leadId } });
    if (proposalExists) {
      return res.status(400).json({ message: 'Cannot delete lead: A proposal is associated with this lead.' });
    }

    await lead.destroy();
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
