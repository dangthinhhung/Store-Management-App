const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isOwner } = require('../middleware/auth');

// All user management routes require owner role
router.use(isOwner);

router.get('/', userController.index);
router.get('/add', (req, res) => res.render('users/add', { title: 'Thêm nhân viên', active: 'users' }));
router.post('/', userController.create);
router.get('/:id/edit', userController.editForm);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);
router.get('/salary-slip', userController.salarySlipForm);
router.post('/salary-slips', userController.createSalarySlip);
router.post('/salary-slips/:id', userController.updateSalarySlip);
router.get('/salary-slips/:id', userController.showSalarySlip);
router.get('/salary-slips/:id/edit', userController.editSalarySlipForm);
router.post('/salary-slips/:id/delete', userController.deleteSalarySlip);
router.get('/salary-slip/code/:code', userController.showSalarySlipByCode);

module.exports = router;
