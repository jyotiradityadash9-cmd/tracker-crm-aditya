const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const followUpController = require('../controllers/followUpController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Lead CRUD
router.get('/', authenticateJWT, leadController.getLeads);
router.post('/', authenticateJWT, leadController.createLead);
router.get('/:id', authenticateJWT, leadController.getLeadById);
router.put('/:id', authenticateJWT, leadController.updateLead);
router.delete('/:id', authenticateJWT, leadController.deleteLead);

// Follow-ups under Lead
router.get('/:leadId/followups', authenticateJWT, followUpController.getFollowUpsByLead);
router.post('/:leadId/followups', authenticateJWT, followUpController.createFollowUp);

// Follow-up actions directly
router.put('/followups/:id', authenticateJWT, followUpController.updateFollowUp);
router.delete('/followups/:id', authenticateJWT, followUpController.deleteFollowUp);

module.exports = router;
