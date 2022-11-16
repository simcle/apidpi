const express = require('express');
const router = express.Router()

const receiptsController = require('../controllers/receipts');

router.get('/', receiptsController.getReceipts);
router.get('/detail/:receiveId', receiptsController.detailReceive);
router.post('/validate/:receiveId', receiptsController.validateReceive);
router.post('/backorder', receiptsController.createBackOrder);

module.exports = router;