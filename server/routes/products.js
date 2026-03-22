const express = require('express');
const router  = express.Router();
const productsController = require('../controllers/products_con');
const upload             = require('../middleware/upload');
const { protect }        = require('../middleware/auth.js'); // ✅ import protect

router.get('/',        protect, productsController.getProducts);
router.get('/:id',     protect, productsController.getProducts);
router.post('/',       protect, upload.single('image'), productsController.createProduct);
router.put('/:id',     protect, upload.single('image'), productsController.updateProduct);
router.delete('/:id',  protect, productsController.deleteProduct);
router.delete('/:id/image', protect, productsController.deleteImage);

module.exports = router;