const { sequelize } = require('./config/database');
const { Lead, Proposal, ProposalItem } = require('./models');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const leads = await Lead.findAll();
    if (leads.length === 0) {
      console.log('No leads found in database. Please run the main server first to seed default users and leads.');
      process.exit(0);
    }

    console.log(`Found ${leads.length} leads. Seeding dummy proposals...`);

    const existingCount = await Proposal.count();
    
    // Proposal 1: Acme Corp
    const prop1Number = `PROP-20260703-100${existingCount + 1}`;
    const p1 = await Proposal.create({
      proposalNumber: prop1Number,
      leadId: leads[0].id,
      proposalDate: '2026-07-03',
      validTill: '2026-08-03',
      status: 'Draft',
      discountPercent: 10.00,
      subTotal: 15000.00,
      grandTotal: 13500.00,
      notes: 'Initial solution design proposal for Cloud Migration and Support services.'
    });

    await ProposalItem.create({
      proposalId: p1.id,
      serviceName: 'Cloud Migration Consulting',
      quantity: 1,
      unitPrice: 10000.00,
      lineTotal: 10000.00
    });

    await ProposalItem.create({
      proposalId: p1.id,
      serviceName: 'Monthly SLA Premium Support',
      quantity: 5,
      unitPrice: 1000.00,
      lineTotal: 5000.00
    });

    // Update totals
    const p1SubTotal = 15000.00;
    const p1Discount = 10;
    const p1Grand = p1SubTotal - (p1SubTotal * p1Discount / 100);
    await p1.update({
      subTotal: p1SubTotal,
      grandTotal: p1Grand
    });

    // Proposal 2: Globex Corp
    if (leads[1]) {
      const prop2Number = `PROP-20260703-200${existingCount + 1}`;
      const p2 = await Proposal.create({
        proposalNumber: prop2Number,
        leadId: leads[1].id,
        proposalDate: '2026-07-03',
        validTill: '2026-09-03',
        status: 'Submitted',
        discountPercent: 5.00,
        subTotal: 48000.00,
        grandTotal: 45600.00,
        notes: 'Enterprise Software License and Training Package.'
      });

      await ProposalItem.create({
        proposalId: p2.id,
        serviceName: 'Enterprise License',
        quantity: 8,
        unitPrice: 5000.00,
        lineTotal: 40000.00
      });

      await ProposalItem.create({
        proposalId: p2.id,
        serviceName: 'Onsite Team Training (Days)',
        quantity: 8,
        unitPrice: 1000.00,
        lineTotal: 8000.00
      });
    }

    console.log('Dummy proposals and items seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding proposals:', err);
    process.exit(1);
  }
};

run();
