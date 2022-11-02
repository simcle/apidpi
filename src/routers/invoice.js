const express = require('express');
const router = express.Router()

const invoiceController = require('../controllers/invoice');


router.get('/', invoiceController.getInvoive);
router.post('/create', invoiceController.createInvoice);
router.get('/detail/:invoiceId', invoiceController.getDetailInvoice);
router.put('/confirm/:invoiceId', invoiceController.confirmInvoice);

module.exports = router;