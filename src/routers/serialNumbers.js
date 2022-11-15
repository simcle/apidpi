const express = require('express');
const router = express.Router();

const serialNumbersController = require('../controllers/serialNumber');

router.get('/', serialNumbersController.getSerialNumber);

module.exports = router;