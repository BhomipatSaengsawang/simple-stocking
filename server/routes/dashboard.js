const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard_con');

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getDashboardStats);

router.get('/order', dashboardController.getAllOrders);

module.exports = router;
