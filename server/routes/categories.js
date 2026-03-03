const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories_con');

router.get('/', categoriesController.getAllCat);

router.get('/:id', categoriesController.getCatByid);

router.post('/', categoriesController.addCategory);

router.put('/:id', categoriesController.modCategory);

router.delete('/:id', categoriesController.delCategory);

module.exports = router;