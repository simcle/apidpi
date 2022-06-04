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
router.put('/update/:quotationId', quotationController.putQuotation);

module.exports = router;