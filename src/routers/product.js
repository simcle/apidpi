const express = require('express');
const multer = require('multer');
const router = express.Router();
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(file.fieldname === 'images') {
            cb(null, 'public/img/temp');
        }
        if(file.fieldname == 'files') {
            cb(null, 'public/attachments')
        }
    },
    filename: (req, file, cb) => {
        const time = new Date().getTime()
        const ext = file.mimetype.split("/")[1];
        if(file.fieldname === 'images') {
            cb(null, `${time}.${ext}`);
        }
        if(file.fieldname === 'files') {
            cb(null, file.originalname)
        }
    }
});

const updateFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(file.fieldname === 'images') {
            cb(null, 'public/img/temp');
        }
        if(file.fieldname == 'files') {
            cb(null, 'public/attachments')
        }
    },
    filename: (req, file, cb) => {
        if(file.fieldname === 'images') {
            cb(null, file.originalname)
        }
        if(file.fieldname === 'files') {
            cb(null, file.originalname)
        }
    }
});

const upload = multer({storage: fileStorage});
const uploadUpdate = multer({storage: updateFileStorage});
const productController = require('../controllers/product');

router.get('/', productController.getProducts);
router.get('/filter', productController.getProductFilter);
router.get('/create', productController.createProduct);
router.get('/edit/:productId', productController.editProduct);
router.get('/accessories', productController.getProductAccessories);
router.post('/create', upload.fields([{name: 'images', maxCount: 6}, {name: 'files'}]), productController.postProduct);
router.put('/update/:productId', uploadUpdate.fields([{name: 'images', maxCount: 6}, {name: 'files'}]), productController.putProduct);
router.put('/update/price/:productId', productController.putSellingPrice);
router.put('/update/status/:productId', productController.putStatus);
router.post('/youtube', productController.getYoutube);
router.get('/warehouse', productController.getWarehouse);
router.get('/stock/:productId', productController.getStock);
router.get('/inventory/:productId', productController.getInventory);

module.exports = router;