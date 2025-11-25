const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.index);
router.get('/add', customerController.createForm);
router.get('/search', customerController.apiSearch); // Moved before :phone route
router.post('/', customerController.store);
router.get('/:phone', customerController.show);
router.get('/:phone/edit', customerController.editForm);
router.put('/:phone', customerController.update);

module.exports = router;
