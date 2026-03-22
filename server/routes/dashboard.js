const express = require('express');
const router  = express.Router();
const dashboardController = require('../controllers/dashboard_con');
const { protect } = require('../middleware/auth.js'); // ✅ import protect

// GET /api/dashboard/stats
router.get('/stats', protect, dashboardController.getDashboardStats); // ✅
router.get('/order', protect, dashboardController.getAllOrders);       // ✅

module.exports = router;