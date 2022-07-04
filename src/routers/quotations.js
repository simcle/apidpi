const express = require('express')
const router = express.Router()

const quotationController = require('../controllers/quotation');

router.get('/', quotationController.getQuotations);
router.get('/detail/:quotationId', quotationController.getDetailQotation);
router.get('/create', quotationController.createQuotation);
router.get('/edit/:quotationId', quotationController.editQuotation);
router.get('/customer', quotationController.getCustomers);
router.get('/product', quotationController.getProduct);
router.post('/create', quotationController.postQuotation);
router.post('/duplicate/:quotationId', quotationController.duplicateQuotation);
router.put('/update/:quotationId', quotationController.putQuotation);
router.put('/close/:quotationId', quotationController.closeQuotation);
router.put('/convert/:quotationId', quotationController.convertQuotations);

module.exports = router;