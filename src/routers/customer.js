const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customer');

router.get('/', customerController.getCustomers);
router.get('/create', customerController.createCustomer);
router.post('/create', customerController.postCustomer);
router.get('/edit/:customerId', customerController.editCustomer);
router.put('/update/:customerId', customerController.putCustomer);
router.get('/detail/:customerId', customerController.deatailCustomer);
router.post('/customer-group', customerController.postCustomerGruop);
router.put('/customer-group/:customerGroupId', customerController.putCustomerGroup);
router.delete('/customer-group/:customerGroupId', customerController.deleteCustomerGroup);
router.put('/address/:customerId', customerController.putCustomerAddress);
router.put('/contact/:customerId', customerController.putCustomerContact);

module.exports = router;