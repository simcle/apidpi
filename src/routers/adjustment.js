const express = require('express');
const router = express.Router();

const adjustmentController = require('../controllers/adjustment');

router.get('/', adjustmentController.getAdjustments);
router.get('/create', adjustmentController.createAdjustment);
router.get('/product', adjustmentController.getProducts);
router.post('/create', adjustmentController.postAdjustment);
router.get('/detail/:adjustmentId', adjustmentController.getDetailAdjustment);
router.get('/edit/:adjustmentId', adjustmentController.editAdjustment);
router.put('/update/:adjustmentId', adjustmentController.putAdjustment);
router.put('/inventory/:adjustmentId', adjustmentController.putAdjustmentInventory);
router.delete('/delete/:adjustmentId', adjustmentController.deleteAdjustmetn);

module.exports = router;