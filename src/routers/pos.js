const express = require('express');
const router = express.Router();

const posController = require('../controllers/pos');

router.get('/', posController.getPos);
router.get('/create', posController.createPos);
router.post('/insert', posController.insertPos);

module.exports = router;