const express = require('express');
const router  = express.Router();
const saleController = require('../controllers/sale_con');
const { protect }    = require('../middleware/auth.js'); // ✅ import protect

// POST /api/sales
router.post('/',    protect, saleController.createSale);

// GET /api/sales
router.get('/',     protect, saleController.getSalesHistory);

// GET /api/sales/:id
router.get('/:id',  protect, saleController.getSaleById);

module.exports = router;