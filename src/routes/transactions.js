const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/', transactionController.index);
router.get('/code/:code', transactionController.showByCode);
// router.post('/', transactionController.store); // Currently handled by reportController via /reports/transaction

module.exports = router;
