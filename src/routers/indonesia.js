const express = require('express');
const router = express.Router();

const indonesiaController = require('../controllers/indonesia');

router.get('/provinces', indonesiaController.getProvinces);
router.get('/cities/:provinceId', indonesiaController.getCities);
router.get('/subdistricts/:cityId', indonesiaController.getSubdistricts);

module.exports = router;