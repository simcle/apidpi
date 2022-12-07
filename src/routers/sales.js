const express = require('express');
const router = express.Router();

const salesController = require('../controllers/sales');

router.get('/', salesController.getSales);
router.get('/edit/:salesId', salesController.editSales);
router.put('/update/:salesId', salesController.updateSales)
router.get('/detail/:salesId', salesController.getDetailSales);

module.exports = router;