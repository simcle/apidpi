const express = require('express');
const router = express.Router();

const tokopediaController = require('../controllers/tokopedia');

router.get('/migrate', tokopediaController.exportProduct);


module.exports = router