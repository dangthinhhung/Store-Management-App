const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isOwner } = require('../middleware/auth');

// All report routes require owner role
router.use(isOwner);

router.get('/', reportController.index);
router.get('/transaction/:id', reportController.showTransaction);
router.post('/transaction', reportController.createTransaction);
router.post('/transaction/:id/toggle-hide', reportController.toggleHideTransaction);
router.delete('/transaction/:id', reportController.deleteTransaction);

router.post('/order/:id/toggle-hide', reportController.toggleHideOrder);
router.delete('/order/:id', reportController.deleteOrder);

router.post('/workshop-payment/:id/toggle-hide', reportController.toggleHideWorkshopPayment);
router.delete('/workshop-payment/:id', reportController.deleteWorkshopPayment);

router.post('/salary/:id/toggle-hide', reportController.toggleHideSalary);
router.delete('/salary/:id', reportController.deleteSalary);

module.exports = router;
