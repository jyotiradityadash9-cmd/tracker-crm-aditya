const bcrypt = require('bcryptjs');
const { User, Lead, FollowUp, Proposal, ProposalItem } = require('./index');

const seedDatabase = async () => {
  try {
    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already seeded or users exist. Skipping seed.');
      return;
    }

    console.log('Seeding database with default users and mock data...');

    // 1. Create Users
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const salesPasswordHash = await bcrypt.hash('Sales@123', 10);

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    const salesUser = await User.create({
      name: 'Sales Rep',
      email: 'sales@demo.com',
      passwordHash: salesPasswordHash,
      role: 'sales',
    });

    console.log('Default users created.');

    // 2. Create some sample Leads
    const lead1 = await Lead.create({
      leadName: 'John Doe',
      companyName: 'Acme Corp',
      email: 'john@acme.com',
      phone: '1234567890',
      source: 'Website',
      status: 'Qualified',
      expectedDealAmount: 75000.00,
      assignedToUserId: salesUser.id,
    });

    const lead2 = await Lead.create({
      leadName: 'Jane Smith',
      companyName: 'Globex Corp',
      email: 'jane@globex.com',
      phone: '9876543210',
      source: 'Referral',
      status: 'Contacted',
      expectedDealAmount: 120000.00,
      assignedToUserId: salesUser.id,
    });

    const lead3 = await Lead.create({
      leadName: 'Bob Johnson',
      companyName: 'Initech',
      email: 'bob@initech.com',
      phone: '5551234567',
      source: 'Cold Call',
      status: 'New',
      expectedDealAmount: 30000.00,
      assignedToUserId: salesUser.id,
    });

    console.log('Sample leads created.');

    // 3. Create sample Follow-Ups
    await FollowUp.create({
      leadId: lead1.id,
      followUpDate: '2026-07-01',
      followUpType: 'Call',
      notes: 'Had a great call. John is interested in our services.',
      outcome: 'Interested', // This would make status Qualified, we'll manually set it or let hook handle it
      nextFollowUpDate: '2026-07-10',
    });

    await FollowUp.create({
      leadId: lead2.id,
      followUpDate: '2026-07-02',
      followUpType: 'Meeting',
      notes: 'Demoed the dashboard. Jane liked the reporting tools.',
      outcome: 'Demo Completed',
      nextFollowUpDate: '2026-07-05',
    });

    console.log('Sample follow-ups created.');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
