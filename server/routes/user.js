const express = require('express');
const router = express.Router();
const authController = require('../controllers/user_con.js');
const { protect } = require('../middleware/auth.js')

// Auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);

router.get('/promptpay', protect, authController.getPromptPay);
router.put('/promptpay', protect, authController.updatePromptPay);

module.exports = router;