const express = require('express');
const router = express.Router();

const stockOnameController = require('../controllers/stockOpname');

router.get('/', stockOnameController.getStockOpname);
router.get('/create', stockOnameController.createStockOpname);
router.get('/products', stockOnameController.searchProduct);
router.get('/product-lists', stockOnameController.getProducts);
router.post('/insert', stockOnameController.insertStockOpname);
router.get('/edit/:stockOpnameId', stockOnameController.editStockOpname);
router.put('/update/:stockOpnameId', stockOnameController.updateStockOpname);
router.put('/validate/:stockOpnameId', stockOnameController.validateStockOpname);

module.exports = router;