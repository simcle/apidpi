const express = require('express');
const router = express.Router();

const salesController = require('../controllers/sales');

router.get('/', salesController.getSales);
router.get('/create', salesController.createSalse);
router.get('/edit/:salesId', salesController.editSales);
router.get('/customer', salesController.getCustomers);
router.get('/product', salesController.getProduct);
router.post('/create', salesController.postSales);
router.put('/update/:salesId', salesController.putSales)
router.get('/detail/:salesId', salesController.getDetailSales);

module.exports = router;