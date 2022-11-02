const express = require('express');
const router = express.Router();

const salesController = require('../controllers/sales');

router.get('/', salesController.getSales);
router.put('/update/:salesId', salesController.updateSales)
router.get('/detail/:salesId', salesController.getDetailSales);

module.exports = router;