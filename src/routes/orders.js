const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.pos);
router.get('/history', orderController.history);
router.get('/code/:code', orderController.showByCode);
router.post('/', orderController.store);
router.get('/:id', orderController.show);

module.exports = router;
