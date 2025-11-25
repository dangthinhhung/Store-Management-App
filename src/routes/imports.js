const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');

router.get('/', importController.index);
router.get('/create', importController.createForm);
router.post('/', importController.store);
router.get('/code/:code', importController.showByCode);
router.get('/:id', importController.show);

module.exports = router;
