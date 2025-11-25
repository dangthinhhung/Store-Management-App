const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');

router.get('/', workshopController.index);
router.get('/create', workshopController.createForm);
router.post('/', workshopController.store);
router.get('/code/:code', workshopController.showByCode);
router.get('/:id', workshopController.show);
router.post('/:id/payment', workshopController.addPayment);
router.post('/:id/status', workshopController.updateStatus);

module.exports = router;
