const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment');

router.post('/create', paymentController.createPayment);

module.exports = router;