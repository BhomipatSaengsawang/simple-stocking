const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products_con');

// "GET" all products
router.get('/', productsController.getAll);

// "GET" product by id
router.get('/:id', productsController.getByid);

// "POST" create new product
router.post('/add', productsController.addProduct);

// "PUT" update product
router.put('/:id', productsController.upProduct);

// "PATCH" product
router.patch('/:id', productsController.patchProduct);

// "DELETE" product
router.delete('/:id', productsController.delProduct);

module.exports = router;