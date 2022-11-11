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
router.put('/confirm/:purchaseId', purchaseController.confirmPurchase);
router.put('/cancelled/:purchaseId', purchaseController.canceledPurchase);
router.put('/settorfq/:purchaseId', purchaseController.setToRfq);
router.put('/receive/:purchaseId', purchaseController.receiveProducts);

module.exports = router;

