const express = require('express');
const router  = express.Router();
const categoriesController = require('../controllers/categories_con');
const { protect } = require('../middleware/auth.js'); // ✅ import protect

router.get('/',     protect, categoriesController.getAllCat);
router.get('/:id',  protect, categoriesController.getCatByid);
router.post('/',    protect, categoriesController.addCategory);
router.put('/:id',  protect, categoriesController.modCategory);
router.delete('/:id', protect, categoriesController.delCategory);

module.exports = router;