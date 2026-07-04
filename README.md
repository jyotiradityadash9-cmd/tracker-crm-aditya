Please make sure of the following while submitting:
Share the frontend and backend repository links
CI/CD should be enabled for both repositories
Share the live deployed project link
Share the API / backend live link as well if deployed separately
The task document already contains all the required details, including:
which tech stack to use
what needs to be developed
required modules, APIs and deliverables
Please go through the task document carefully and build the solution accordingly.

1.5-Day Task — Smart Lead Follow-up & Proposal Tracker
Build a small internal sales application called Smart Lead Follow-up & Proposal Tracker using Angular + Bootstrap for frontend and nodejs expressjs Web API for backend. The application should allow a sales user to manage leads, add follow-ups, create proposals, and allow an admin to approve or reject submitted proposals.

1. Mandatory Tech Stack
   • Frontend: Angular (latest stable / Angular 17+), Bootstrap-based UI/CSS, Reactive Forms
   • Backend: nodejs expressjs Web API
   • Database: mySql
   • Authentication: JWT
   • Repositories: separate frontend and backend repos
   • AI Feature: Proposal summary generation from backend
2. Repositories
   •lead-tracker-ui — Angular frontend
   •lead-tracker-api — backend
3. Submission Timeline
   • Complete the task and share the submission within 1.5 days (36 hours).
   • Share frontend repo, backend repo, and deployed live links.
4. Seed Users
   •admin@demo.com / Admin@123
   •sales@demo.com / Sales@123
5. Modules to Build
   5.1 Authentication
   • Login API + JWT token
   • Angular auth guard
   • Role-based menu / route access
   APIs
   •POST /api/auth/login
   • GET /api/auth/me
   5.2 Lead Management
   Lead fields: Lead Name, Company Name, Email, Phone, Source, Status, Expected Deal Amount, Assigned To, Created Date
   • Lead list with search + filters by status and source
   • Add lead
   • Edit lead
   • Lead detail page
   • Delete lead should be blocked if a proposal already exists
   Lead APIs
   • GET /api/leads
   • GET /api/leads/{id}
   •POST /api/leads
   •PUT /api/leads/{id}
   •DELETE /api/leads/{id}
   5.3 Follow-up Management
   Each lead can have multiple follow-ups.
   Follow-up fields: FollowUpDate, FollowUpType (Call / Email / Meeting), Notes, Outcome, NextFollowUpDate • Add follow-up to a lead
   • Edit follow-up
   • Delete follow-up
   • Show follow-up history on lead details page
   Business rules
   •If outcome = Interested, lead status should automatically become Qualified
   •If outcome = Not Interested, lead status should automatically become Lost
   •If next follow-up date is in the past and lead status is still New/Contacted, show an Overdue Follow-up badge
   Follow-up APIs
   • GET /api/leads/{leadId}/followups
   •POST /api/leads/{leadId}/followups
   •PUT /api/followups/{id}
   •DELETE /api/followups/{id}
   5.4 Proposal Management
   Proposal can only be created for leads in Qualified or Contacted status.
   Proposal header fields: ProposalNumber, LeadId, ProposalDate, ValidTill, Status, DiscountPercent, Notes, AiSummary, AiRecommendation
   Proposal item fields: ServiceName, Quantity, UnitPrice, LineTotal
   • Proposal list page
   • Create proposal
   • Edit draft proposal
   • Proposal details page
   • Add / remove proposal line items
   • Use FormArray for proposal items
   • Auto-calculate totals while editing
   Proposal calculations
   LineTotal = Quantity × UnitPrice
   SubTotal = Sum(LineTotal)
   DiscountAmount = SubTotal × DiscountPercent / 100
   GrandTotal = SubTotal − DiscountAmount
   Proposal approval rules
   •If DiscountPercent > 20, proposal requires admin approval
   •If GrandTotal > 500000, proposal requires admin approval
   • Admin can approve or reject only submitted proposals
   • When a proposal is approved, related lead status should become Converted
   Proposal APIs
   • GET /api/proposals
   • GET /api/proposals/{id}
   •POST /api/proposals
   •PUT /api/proposals/{id}
   •POST /api/proposals/{id}/submit
   •POST /api/proposals/{id}/approve
   •POST /api/proposals/{id}/reject
   5.5 AI Proposal Summary
   • Add a button on proposal page: Generate AI Summary
   • Frontend should call backend API
   • Backend should generate a short proposal summary + recommendation using proposal data and latest follow-up notes
   • Store the generated summary/recommendation against the proposal
   AI API
   •POST /api/proposals/{id}/generate-ai-summary
   5.6 Dashboard
   • Show summary cards for Total Leads, Qualified Leads, Overdue Follow-ups, Submitted Proposals, Approved Proposals This Month
   Dashboard API
   • GET /api/dashboard/summary
6. Common Grid / List Requirements
   • All major listing pages should support server-side pagination, server-side searching and server-side sorting • Page size options must be 10 / 20 / 50
   • Each listing page should have a Download PDF button
   • PDF should be generated from backend and should include all filtered records, not just the current page • Sorting/search/filter state should be respected in the downloaded report
7. Frontend Requirements
   • Use Bootstrap for forms, tables, cards, badges, buttons, layout and styling
   • Use Reactive Forms
   • Proposal screen must use FormArray
   • Lead list should have search + filters
   • Show validation messages and loading states
   • Protect routes after login
8. Backend Requirements
   • Use DTOs
   • Use JWT auth
   • Keep business logic outside controllers
   • Use proper validation
   • Expose Swagger
   • Seed users and basic sample data
   •Implement report generation endpoints for required grid pages
9. Suggested Database Tables
   • Users: Id, Name, Email, PasswordHash, Role
   • Leads: Id, LeadName, CompanyName, Email, Phone, Source, Status, ExpectedDealAmount, AssignedToUserId, CreatedAt
   • FollowUps: Id, LeadId, FollowUpDate, FollowUpType, Notes, Outcome, NextFollowUpDate, CreatedAt
   • Proposals: Id, ProposalNumber, LeadId, ProposalDate, ValidTill, Status, DiscountPercent, SubTotal, GrandTotal, Notes, AiSummary, AiRecommendation, CreatedAt
   • ProposalItems: Id, ProposalId, ServiceName, Quantity, UnitPrice, LineTotal
10. CI/CD
    • Frontend pipeline: install dependencies, build Angular app, publish artifact
    • Backend pipeline: restore, build API, publish artifact
11. Deliverables
    • Frontend repo + backend repo
    • README in both repos with setup steps
    • DB migration / SQL script
    • Swagger or Postman collection
    • Basic CI/CD pipeline files
    • Deployed live links for frontend and backend
