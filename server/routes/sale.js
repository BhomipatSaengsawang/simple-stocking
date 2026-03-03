const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale_con');

// เส้นทางสำหรับบันทึกการขาย (Checkout)
// POST /api/sales
router.post('/', saleController.createSale);

// เส้นทางสำหรับดึงประวัติการขายทั้งหมด
// GET /api/sales
router.get('/', saleController.getSalesHistory);

// เส้นทางสำหรับดึงรายละเอียดรายบิล (ใช้ตอนดูใบเสร็จย้อนหลัง)
// GET /api/sales/:id
router.get('/:id', saleController.getSaleById);

module.exports = router;
