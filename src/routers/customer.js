const express = require('express');
const router = express.Router();
const multer = require('multer');
const uuid = require('uuid');

// file image storage
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/temp');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `${uuid.v1()}.${ext}`);
    }
});
const upload = multer({storage: fileStorage});


const customerController = require('../controllers/customer');

router.get('/', customerController.getCustomers);
router.post('/create', upload.single('image'), customerController.postCustomer);
router.get('/edit/:customerId', customerController.editCustomer);
router.put('/update/:customerId', upload.single('image'), customerController.putCustomer);
router.get('/detail/:customerId', customerController.deatailCustomer);
router.get('/auto-search', customerController.getCustomersAutoSearch);

module.exports = router;