const express = require('express');
const router = express.Router()

const reconciliateController = require('../controllers/reconciliate');


router.get('/customer', reconciliateController.customerInvoice);
router.post('/customer', reconciliateController.customerPost);
module.exports = router;