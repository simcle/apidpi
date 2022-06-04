const express = require('express');
const router = express.Router();

const supplierController = require('../controllers/supplier');
router.get('/', supplierController.getSuppliers);
router.get('/create', supplierController.createSupplier);
router.post('/new', supplierController.postSupplier);
router.get('/detail/:supplierId', supplierController.detailSupplier);
router.get('/edit/:supplierId', supplierController.editSupplier);
router.put('/update/:supplierId', supplierController.updateSupplier);
router.put('/address/:supplierId', supplierController.putSupplierAddress);
router.put('/contact/:supplierId', supplierController.putSupplierContact);

module.exports = router;