const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products_con');
const upload = require('../middleware/upload');

router.get('/', productsController.getProducts);

router.get('/:id', productsController.getProducts);

router.post('/', upload.single('image'), productsController.createProduct);

router.put('/:id', upload.single('image'), productsController.updateProduct);

router.delete('/:id', productsController.deleteProduct);

router.delete('/:id/image', productsController.deleteImage);

module.exports = router;
