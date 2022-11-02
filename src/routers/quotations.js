const express = require('express')
const router = express.Router()

const quotationController = require('../controllers/quotation');

router.get('/', quotationController.getQuotations);
router.get('/detail/:quotationId', quotationController.getDetailQotation);
router.get('/create', quotationController.createQuotation);
router.post('/create', quotationController.postQuotation);
router.get('/edit/:quotationId', quotationController.editQuotation);
router.post('/duplicate/:quotationId', quotationController.duplicateQuotation);
router.put('/update/:quotationId', quotationController.putQuotation);
router.put('/cancel/:quotationId', quotationController.cancelQuotation);
router.put('/settoquotation/:quotationId', quotationController.setToQuotation);
router.put('/confirm/:quotationId', quotationController.confirmQuotation);

module.exports = router;