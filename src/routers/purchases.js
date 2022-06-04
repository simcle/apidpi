const express = require('express');
const router = express.Router();

const purchaseController = require('../controllers/purchase');

router.get('/', purchaseController.getPurchases);
router.get('/create', purchaseController.createPurchase);
router.get('/edit/:purchaseId', purchaseController.editPurchase);
router.get('/supplier', purchaseController.getSupplier);
router.post('/create', purchaseController.postPurchase);
router.get('/detail/:purchaseId', purchaseController.getDetailPurchase);
router.put('/update/:purchaseId', purchaseController.putPurchase);

module.exports = router;

