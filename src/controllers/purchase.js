const mongoose = require('mongoose');
const PaymentTerms = require('../models/paymentTerm');
const ShipmentMethods = require('../models/shipping');
const ShipmentTerms = require('../models/shipmentTerm');
const Currencies = require('../models/currencies');
const AdditionalCharges = require('../models/additionalCharge');
const TaxCode = require('../models/taxCode');
const Suppliers = require('../models/suppliers');
const Purchases = require('../models/purchases');
const receiveProduct = require('../modules/receive');
exports.getPurchases = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search
    const filters = req.query.filters;
    let query = {}
    if(filters) {
        query = {status: {$in: filters}}
    }
    let totalItems;
    Purchases.aggregate([
        {$lookup: {
            from: 'suppliers',
            foreignField: '_id',
            localField: 'supplierId',
            pipeline:[
                {$project: {
                    _id: 0,
                    name: 1
                }}
            ],
            as: 'supplier'
        }},
        {$unwind: {
            path: '$supplier',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'currencies',
            foreignField: '_id',
            localField: 'currencyId',
            pipeline: [
                {$project: {
                    _id: 0,
                    symbolNative: 1
                }}
            ],
            as: 'currencySymbol'
        }},
        {$unwind: {
            path: '$currencySymbol',
            preserveNullAndEmptyArrays: true
        }},
        {$addFields: {
            supplier: '$supplier.name',
            currencySymbol: '$currencySymbol.symbolNative'
        }},
        {$match: {$and: [{supplier: {$regex: '.*'+search+'.*', $options: 'i'}}, query]}},
        {$count: 'count'}
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return Purchases.aggregate([
            {$lookup: {
                from: 'suppliers',
                foreignField: '_id',
                localField: 'supplierId',
                pipeline:[
                    {$project: {
                        _id: 0,
                        name: 1
                    }}
                ],
                as: 'supplier'
            }},
            {$unwind: {
                path: '$supplier',
                preserveNullAndEmptyArrays: true
            }},
            {$lookup: {
                from: 'currencies',
                foreignField: '_id',
                localField: 'currencyId',
                pipeline: [
                    {$project: {
                        _id: 0,
                        symbolNative: 1
                    }}
                ],
                as: 'currencySymbol'
            }},
            {$unwind: {
                path: '$currencySymbol',
                preserveNullAndEmptyArrays: true
            }},
            {$addFields: {
                supplier: '$supplier.name',
                currencySymbol: '$currencySymbol.symbolNative'
            }},
            {$match: {$and: [{supplier: {$regex: '.*'+search+'.*', $options: 'i'}}, query]}},
            {$sort: {createdAt: -1}},
            {$skip: (currentPage -1) * perPage},
            {$limit: perPage}
        ])
    })
    .then(result => {
        const last_page = Math.ceil(totalItems / perPage)
        const pageValue = currentPage * perPage - perPage + 1
        const pageLimit = pageValue + result.length -1
        res.status(200).json({
            data: result,
            pages: {
                current_page: currentPage,
                last_page: last_page,
                pageValue: pageValue+'-'+pageLimit,
                totalItems: totalItems 
            },
        })
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.getDetailPurchase = (req, res) => {
    const purchaseId = mongoose.Types.ObjectId(req.params.purchaseId);
    Purchases.aggregate([
        {$match: {_id: purchaseId}},
        {$lookup: {
            from: 'suppliers',
            foreignField: '_id',
            localField: 'supplierId',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1
                }}
            ],
            as: 'supplier'
        }},
        {$unwind: '$supplier'},
        {$lookup: {
            from: 'currencies',
            foreignField:'_id',
            localField: 'currencyId',
            as: 'currency'
        }},
        {$unwind: '$currency'},
        {$addFields: {
            supplier: '$supplier.name',
            currency: '$currency.code',
            currencySymbol: '$currency.symbolNative',
        }},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1
                }},
            ],
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$addFields: {
            'items.name': '$items.product.name',
        }},
        {$unset: 'items.product'},
        {$group: {
            _id: '$_id',
            items: {$push: '$items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.items' : 0,
        }},
        {$replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    { items: "$items" },
                    "$root"
                ]
            }
        }},
    ])
    .then(result => {
        res.status(200).json(result[0])
    })
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
    const purchaseId = mongoose.Types.ObjectId(req.params.purchaseId);
    const paymentTerms = PaymentTerms.find().select('_id code').sort({code: '1'}).lean();
    const shipmentMethods = ShipmentMethods.find().select('_id name').sort({name: '1'}).lean();
    const shipmentTerms = ShipmentTerms.find().select('_id code').sort({code: '1'}).lean();
    const currencies = Currencies.find({status: true}).sort({name: '1'}).lean();
    const additionalCharges = AdditionalCharges.find({status: true}).sort({name: '1'}).lean();
    const taxCode = TaxCode.find().sort({code: '1'}).lean();
    const purchase = Purchases.aggregate([
        {$match: {_id: purchaseId}},
        {$lookup: {
            from: 'suppliers',
            foreignField: '_id',
            localField: 'supplierId',
            as: 'supplier'
        }},
        {$unwind: '$supplier'},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                }},
            ],
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$addFields: {
            'items.name': '$items.product.name',
        }},
        {$unset: 'items.product'},
        {$group: {
            _id: '$_id',
            items: {$push: '$items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.items' : 0,
        }},
        {$replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    { items: "$items" },
                    "$root"
                ]
            }
        }}
    ])
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
            purchase: result[6][0],
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
            dateValidaty: req.body.dateValidaty,
            estimatedReceiveDate: req.body.estimatedReceiveDate,
            paymentTermId: req.body.paymentTermId,
            currencyId: req.body.currencyId,
            exchangeRate: req.body.exchangeRate,
            additionalCharges: req.body.additionalCharges,
            shipping: req.body.shipping.shipmentMethodId ? req.body.shipping:'',
            items: req.body.items,
            total: req.body.total,
            totalAdditionalCharges: req.body.totalAdditionalCharges,
            discount: req.body.discount,
            tax: req.body.tax,
            grandTotal: req.body.grandTotal,
            status: 'RFQ',
            receiveStatus: 'Nothing to Receive',
            billingStatus: 'Nothing to Bill',
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
        purchase.dateValidaty = req.body.dateValidaty;
        if(req.body.shipping.shipmentMethodId) {
            purchase.shipping = req.body.shipping
        }
        purchase.currencyId = req.body.currencyId;
        purchase.exchangeRate = req.body.exchangeRate;
        purchase.additionalCharges = req.body.additionalCharges;
        purchase.items = req.body.items;
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

exports.confirmPurchase = (req, res) => {
    const purchaseId = req.params.purchaseId
    Purchases.findById(purchaseId)
    .then(purchase => {
        purchase.status = 'Purchase Order'
        return purchase.save()
    })
    .then(() => {
        res.status(200).json('OK')
    })
}

exports.receiveProducts = (req, res) => {
    const purchaseId = req.params.purchaseId
    Purchases.findById(purchaseId)
    .then(async (purchase) => {
        if(purchase.billingStatus !== 'Fully Billed')
        purchase.billingStatus ='Waiting Bills'
        purchase.receiveStatus = 'In Progress'
        await purchase.save()
        await receiveProduct(purchase)
        res.status(200).json(purchase)
    })
}

exports.canceledPurchase = (req, res) => {
    const purchaseId = req.params.purchaseId
    Purchases.findById(purchaseId)
    .then(purchase => {
        purchase.status = 'Cancelled'
        return purchase.save()
    })
    .then(() => {
        res.status(200).json('OK')
    })
}

exports.setToRfq = (req, res) => {
    const purchaseId = req.params.purchaseId
    Purchases.findById(purchaseId)
    .then(purchase => {
        purchase.status = 'RFQ'
        return purchase.save()
    })
    .then(() => {
        res.status(200).json('OK')
    })
}
