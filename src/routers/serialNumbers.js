const express = require('express');
const router = express.Router();

const serialNumbersController = require('../controllers/serialNumber');

router.get('/', serialNumbersController.getSerialNumber);
router.get('/detail/:serialId', serialNumbersController.getDetailSerialNumber);

module.exports = router;