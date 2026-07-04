const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, proposalController.getProposals);
router.post('/', authenticateJWT, proposalController.createProposal);
router.get('/:id', authenticateJWT, proposalController.getProposalById);
router.put('/:id', authenticateJWT, proposalController.updateProposal);

router.post('/:id/submit', authenticateJWT, proposalController.submitProposal);
router.post('/:id/approve', authenticateJWT, requireRole(['admin']), proposalController.approveProposal);
router.post('/:id/reject', authenticateJWT, requireRole(['admin']), proposalController.rejectProposal);

router.post('/:id/generate-ai-summary', authenticateJWT, proposalController.generateAiSummary);

module.exports = router;
