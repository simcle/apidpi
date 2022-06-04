const mongoose = require('mongoose');
const PaymentTerms = require('../models/paymentTerm');
const ShipmentMethods = require('../models/shipping');
const ShipmentTerms = require('../models/shipmentTerm');
const Currencies = require('../models/currencies');
const AdditionalCharges = require('../models/additionalCharge');
const TaxCode = require('../models/taxCode');
const Suppliers = require('../models/suppliers');
const Purchases = require('../models/purchases');

exports.getPurchases = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search;
    let totalItems;
    Purchases.find()
    .countDocuments()
    .then(count => {
        totalItems = count;
        return Purchases.find()
        .populate('supplierId', 'name')
        .populate('currencyId', 'symbolNative')
        .skip((currentPage -1 ) * perPage)
        .limit(perPage)
        .sort({createdAt: '-1'});
    })
    .then(result => {
        const last_page = Math.ceil(totalItems / perPage)
        res.status(200).json({
            data: result,
            pages: {
                current_page: currentPage,
                last_page: last_page
            }
        });
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.getDetailPurchase = (req, res) => {
    const purchaseId = req.params.purchaseId;
    Purchases.findById(purchaseId)
    .populate('supplierId', 'name code')
    .populate('paymentTermId', 'code')
    .populate('shipmentTermId', 'code')
    .populate('shipmentMethodId', 'name')
    .populate('currencyId')
    .populate('items.productId', 'name')
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.createPurchase = (req, res) => {
    const paymentTerms = PaymentTerms.find().select('_id code').sort({code: '1'}).lean();
    const shipmentMethods = ShipmentMethods.find().select('_id name').sort({name: '1'}).lean();
    const shipmentTerms = ShipmentTerms.find().select('_id code').sort({code: '1'}).lean();
    const currencies = Currencies.find({status: true}).sort({name: '1'}).lean();
    const additionalCharges = AdditionalCharges.find({status: true}).sort({name: '1'}).lean();
    const taxCode = TaxCode.find().sort({code: '1'}).lean();

    Promise.all([
      paymentTerms,
      shipmentMethods,
      shipmentTerms,
      currencies,
      additionalCharges,
      taxCode
    ])
    .then(result => {
        res.status(200).json({
            paymentTerms: result[0].map(obj => {
                obj.id = obj._id, 
                obj.text = obj.code
                return obj
            }),
            shipmentMethods: result[1].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            shipmentTerms: result[2].map(obj => {
                obj.id = obj._id,
                obj.text = obj.code
                return obj
            }),
            currencies: result[3].map(obj => {
                obj.id = obj._id,
                obj.text = obj.code
                return obj
            }),
            additionalCharges: result[4].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            taxCodes: result[5].map(obj => {
                obj.id = obj.code,
                obj.text = `${obj.code} (${obj.amount}%)`
                return obj
            })
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.editPurchase = (req, res) => {
    const purchaseId = req.params.purchaseId;
    const paymentTerms = PaymentTerms.find().select('_id code').sort({code: '1'}).lean();
    const shipmentMethods = ShipmentMethods.find().select('_id name').sort({name: '1'}).lean();
    const shipmentTerms = ShipmentTerms.find().select('_id code').sort({code: '1'}).lean();
    const currencies = Currencies.find({status: true}).sort({name: '1'}).lean();
    const additionalCharges = AdditionalCharges.find({status: true}).sort({name: '1'}).lean();
    const taxCode = TaxCode.find().sort({code: '1'}).lean();
    const purchase = Purchases.findById(purchaseId).populate('currencyId').populate('items.productId','name')
    Promise.all([
      paymentTerms,
      shipmentMethods,
      shipmentTerms,
      currencies,
      additionalCharges,
      taxCode,
      purchase
    ])
    .then( async (result) => {
        const supplierId = result[6].supplierId
        const supplier = await Suppliers.findById(supplierId)
        res.status(200).json({
            paymentTerms: result[0].map(obj => {
                obj.id = obj._id, 
                obj.text = obj.code
                return obj
            }),
            shipmentMethods: result[1].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            shipmentTerms: result[2].map(obj => {
                obj.id = obj._id,
                obj.text = obj.code
                return obj
            }),
            currencies: result[3].map(obj => {
                obj.id = obj._id,
                obj.text = obj.code
                return obj
            }),
            additionalCharges: result[4].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            taxCodes: result[5].map(obj => {
                obj.id = obj.code,
                obj.text = `${obj.code} (${obj.amount}%)`
                return obj
            }),
            purchase: result[6],
            supplier: supplier
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.getSupplier = (req, res) => {
    const search = req.query.search;
    Suppliers.find({$or: [{name: {$regex:'.*'+ search, $options: 'i'}}, {code: search}]})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

exports.postPurchase = (req, res) => {
    let newID;
    const date = new Date();
    let dd = date.getDate();
    let mm = date.getMonth() +1;
    let yy = date.getFullYear().toString().substring(2);
    let YY = date.getFullYear()
    dd = checkTime(dd);
    mm = checkTime(mm)

    function checkTime (i) {
        if(i < 10) {
            i = `0${i}`
        }
        return i
    }

    let today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    Purchases.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
    .then(result => {
        if(result) {
            const no = result.no.substring(15)
            const newNo = parseInt(no) + 1
            newID = `${dd}${mm}/DPI/PO/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/PO/${yy}/1`
        }

        const purchase = new Purchases({
            no: newID,
            supplierId: req.body.supplierId,
            address: req.body.address,
            referenceNumber: req.body.referenceNumber,
            remarks: req.body.remarks,
            tags: req.body.tags,
            dateOrdered: req.body.dateOrdered,
            estimatedReceiveDate: req.body.estimatedReceiveDate,
            paymentTermId: req.body.paymentTermId,
            shipmentTermId: req.body.shipmentTermId,
            shipmentMethodId: req.body.shipmentMethodId,
            currencyId: req.body.currencyId,
            exchangeRate: req.body.exchangeRate,
            additionalCharges: req.body.additionalCharges,
            items: req.body.items,
            totalQty: req.body.totalQty,
            total: req.body.total,
            totalAdditionalCharges: req.body.totalAdditionalCharges,
            discount: req.body.discount,
            tax: req.body.tax,
            grandTotal: req.body.grandTotal,
            status: 'New',
            receiveStatus: 'In Progress',
            paymentStatus: 'In Progress',
            userId: req.user._id
        })
        return purchase.save();
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putPurchase = (req, res) => {
    const purchaseId = req.params.purchaseId;
    Purchases.findById(purchaseId)
    .then(purchase => {
        purchase.supplierId = req.body.supplierId;
        purchase.address = req.body.address;
        purchase.referenceNumber = req.body.referenceNumber;
        purchase.remarks = req.body.remarks;
        purchase.tags = req.body.tags;
        purchase.dateOrdered = req.body.dateOrdered;
        purchase.estimatedReceiveDate = req.body.estimatedReceiveDate;
        purchase.paymentTermId = req.body.paymentTermId;
        purchase.shipmentTermId = req.body.shipmentTermId;
        purchase.shipmentMethodId = req.body.shipmentMethodId;
        purchase.currencyId = req.body.currencyId;
        purchase.exchangeRate = req.body.exchangeRate;
        purchase.additionalCharges = req.body.additionalCharges;
        purchase.items = req.body.items;
        purchase.totalQty = req.body.totalQty;
        purchase.total = req.body.total;
        purchase.totalAdditionalCharges = req.body.totalAdditionalCharges;
        purchase.discount = req.body.discount;
        purchase.tax = req.body.tax;
        purchase.grandTotal = req.body.grandTotal;
        return purchase.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

