const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.get('/summary', authenticateJWT, dashboardController.getSummary);

module.exports = router;
