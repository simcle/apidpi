const express = require('express');
const router = express.Router();

const deliveryController = require('../controllers/delivery');

router.get('/', deliveryController.getDelivery);
router.get('/detail/:deliveryId', deliveryController.getDetailDelivery);
router.put('/update/:deliveryId', deliveryController.updateDelivery);
router.post('/validate/:deliveryId', deliveryController.validateDelivery);
router.post('/backorder', deliveryController.createBackOrder);
router.put('/tracking/:deliveryId', deliveryController.updateTrackingNumber);

module.exports = router;