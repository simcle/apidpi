const express = require('express');
const router = express.Router();

const transferController = require('../controllers/transfer');

router.get('/', transferController.getTransfer);
router.get('/detail/:transferId', transferController.getDetailTransfer);
router.get('/create', transferController.createTransfer);
router.get('/edit/:transferId', transferController.editTransfer);
router.get('/product/:warehouseId', transferController.getProduct);
router.get('/inventory', transferController.getInventory);
router.get('/inventory/qty', transferController.getInventoryQty);
router.post('/create', transferController.postTransfer);
router.put('/update/:transferId', transferController.putTransfer);
router.put('/inventory/:transferId', transferController.putTransferInventory);

module.exports = router;