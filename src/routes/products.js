const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.index);
router.get('/add', productController.createForm);
router.post('/', productController.store);
router.get('/:code/edit', productController.editForm);
router.put('/:code', productController.update);
router.get('/api/search', productController.apiSearch);

module.exports = router;
