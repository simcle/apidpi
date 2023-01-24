const express = require('express');
const router = express.Router();

const indonesiaController = require('../controllers/indonesia');

router.get('/provinces', indonesiaController.getProvinces);
router.get('/cities', indonesiaController.getCities);
router.get('/subdistricts', indonesiaController.getSubdistricts);
router.get('/cities/:proviceId', indonesiaController.getCitiesCompany);
router.get('/subdistricts/:cityId', indonesiaController.getSubdistrictsCompany)
module.exports = router;