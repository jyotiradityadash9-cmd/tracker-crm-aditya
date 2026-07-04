const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', authenticateJWT, authController.getMe);

module.exports = router;
