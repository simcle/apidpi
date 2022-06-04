const express = require('express');
const router = express.Router();

const generalController = require('../controllers/general');

router.get('/general', generalController.getGeneral);

router.post('/general/currency', generalController.postCurrency);
router.put('/general/currency/:currencyId', generalController.putCurrency);

router.post('/general/payment-terms', generalController.postPaymentTerm);
router.put('/general/payment-terms/:paymentTermId', generalController.putPaymentTerm);
router.delete('/general/payment-terms/:paymentTermId', generalController.deletePaymentTerm);

router.post('/general/shipment-terms', generalController.postShipmentTerm);
router.put('/general/shipment-terms/:shipmentTermId', generalController.putShipmentTerm);
router.delete('/general/shipment-terms/:shipmentTermId', generalController.deleteShipmentTerm);

router.post('/general/shipment-methods', generalController.postShipmentMethod);
router.put('/general/shipment-methods/:shipmentMethodId', generalController.putShipmentMethod);
router.delete('/general/shipment-methods/:shipmentMethodId', generalController.deleteShipmentMethod);

router.post('/general/additional-charges', generalController.postAdditionalCharge);
router.put('/general/additional-charges/:additionalChargeId', generalController.putAdditionalCharge);
router.delete('/general/additional-charges/:additionalChargeId', generalController.deleteAdditionalCharge);

router.post('/general/tax-codes', generalController.postTaxCode);
router.put('/general/tax-codes/:taxCodeId', generalController.putTaxCode);
router.delete('/general/tax-codes/:taxCodeId', generalController.deleteTaxCode);

router.post('/general/credit-terms', generalController.postCreditTerm);
router.put('/general/credit-terms/:creditTermId', generalController.putCreditTerm);
router.delete('/general/credit-terms/:creditTermId', generalController.deleteCreditTerm);

router.post('/general/warehouse', generalController.postWarehouse);
router.put('/general/warehouse/:warehouseId', generalController.putWarehouse);
router.put('/general/warehouse/status/:warehouseId', generalController.putWarehouseStatus);
router.put('/general/warehouse/set-default/:warehouseId', generalController.putWarehouseSetDefault);
router.put('/general/warehouse/order/set', generalController.putWarehouseOrder);
router.delete('/general/warehouse/section/:sectionId', generalController.deleteWarehouseSection);
module.exports = router;
