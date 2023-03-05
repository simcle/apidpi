const mongoose = require('mongoose');
const Customers = require('../models/customers');
const CreditTerms = require('../models/creditTerm');
const ShipmentTerms = require('../models/shipmentTerm');
const ShipmentMethods = require('../models/shipping');
const AdditionalCharges = require('../models/additionalCharge');
const TaxCode = require('../models/taxCode');
const Activity = require('../models/activity');
const Task = require('../models/tasks');
const activity = require('../modules/activityHistory');
const Sales = require('../models/sales');
const Deliveries = require('../models/delivery')
const Invoices = require('../models/invoice');
const moduleDelivery = require('../modules/delivery')

exports.getQuotations = async (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search
    const filterStatus = req.query.filterStatus;
    let query = {}
    if(filterStatus) {
        query = {status: {$in: filterStatus}}
    }
    let totalItems;

    Sales.aggregate([
        {$lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            pipeline: [
                {$graphLookup: {
                    from: 'customers',
                    startWith: '$parentId',
                    connectFromField: 'parentId',
                    connectToField: '_id',
                    as: 'parents'
                }},
                {$unwind: {
                    path: '$parents',
                    preserveNullAndEmptyArrays: true
                }},
                {$sort: {'parents._id': 1}},
                {
                    $group: {
                        _id: "$_id",
                        parents: { $first: "$parents" },
                        root: { $first: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        parent: '$parents.name',
                        name: '$root.name',
                        address: '$root.address',
                        displayName: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: {$concat: ['$parents.name', ', ', '$root.name']},
                                else: '$root.name'
                            }
                        }
                    }
                },
            ],
            as: 'customer'
        }},
        {$unwind: '$customer'},
        {$addFields: {
            'customer': '$customer.displayName'
        }},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                    stock: 1
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
        {$match: {
            $and: [{status: {$ne: 'Sales Order'}}, {$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {quotationNo: {$regex: '.*'+search+'.*', $options:'i'}}, {items: {$elemMatch: {name: {$regex: '.*'+search+'.*', $options:'i'}}}}]}, query]
        }},
        {$count: 'count'}
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return Sales.aggregate([
            {$lookup: {
                from: 'customers',
                localField: 'customerId',
                foreignField: '_id',
                pipeline: [
                    {$graphLookup: {
                        from: 'customers',
                        startWith: '$parentId',
                        connectFromField: 'parentId',
                        connectToField: '_id',
                        as: 'parents'
                    }},
                    {$unwind: {
                        path: '$parents',
                        preserveNullAndEmptyArrays: true
                    }},
                    {$sort: {'parents._id': 1}},
                    {
                        $group: {
                            _id: "$_id",
                            parents: { $first: "$parents" },
                            root: { $first: "$$ROOT" }
                        }
                    },
                    {
                        $project: {
                            parent: '$parents.name',
                            name: '$root.name',
                            address: '$root.address',
                            displayName: {
                                $cond: {
                                    if: {$ifNull: ['$parents.name', false]},
                                    then: {$concat: ['$parents.name', ', ', '$root.name']},
                                    else: '$root.name'
                                }
                            }
                        }
                    },
                ],
                as: 'customer'
            }},
            {$unwind: '$customer'},
            {$addFields: {
                'customer': '$customer.displayName'
            }},
            {$unwind: '$items'},
            {$lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                pipeline: [
                    {$project: {
                        _id: 0,
                        name: 1,
                        stock: 1
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
            {$match: {
                $and: [{status: {$ne: 'Sales Order'}}, {$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {quotationNo: {$regex: '.*'+search+'.*', $options:'i'}}, {items: {$elemMatch: {name: {$regex: '.*'+search+'.*', $options:'i'}}}}]}, query]
            }},
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
}

exports.getDetailQotation = (req, res) => {
    const quotationId = mongoose.Types.ObjectId(req.params.quotationId);
    const quotation = Sales.aggregate([
        {$match: {_id: quotationId}},
        {$lookup : {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    name: 1
                }}
            ],
            as: 'user'
        }},
        {$unwind: '$user'},
        {$lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            pipeline: [
                {$graphLookup: {
                    from: 'customers',
                    startWith: '$parentId',
                    connectFromField: 'parentId',
                    connectToField: '_id',
                    as: 'parents'
                }},
                {$unwind: {
                    path: '$parents',
                    preserveNullAndEmptyArrays: true
                }},
                {$sort: {'parents._id': 1}},
                {
                    $group: {
                        _id: "$_id",
                        parents: { $first: "$parents" },
                        root: { $first: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        parent: '$parents',
                        attn: '$root',
                        displayName: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: {$concat: ['$parents.name', ', ', '$root.name']},
                                else: '$root.name'
                            }
                        }
                    }
                },
            ],
            as: 'customer'
        }},
        {$unwind: '$customer'},
        {$lookup: {
            from: 'shippings',
            foreignField: '_id',
            localField: 'shipping.shipmentMethodId',
            pipeline: [
                {$project: {
                    name: 1,
                }}
            ],
            as: 'shipVia'
        }},
        {$unwind: {
            path: '$shipVia',
            preserveNullAndEmptyArrays: true
        }},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                    stock: 1
                }},
            ],
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$addFields: {
            'items.name': '$items.product.name',
            'items.stock': '$items.product.stock'
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
    const activities = Activity.aggregate([
        {$match: {documentId: quotationId}},
        {$lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 1,
                    name: 1
                }}
            ],
            as: 'userId'
        }},
        {$unwind: '$userId'},
        {$unwind: '$original.items'},
        {$lookup: {
            from: 'products',
            localField: 'original.items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1
                }},
            ],
            as: 'original.items.product'
        }},
        {$unwind: '$original.items.product'},
        {$addFields: {
            'original.items.name': '$original.items.product.name'
        }},
        {$unset: 'original.items.product'},
        {$group: {
            _id:'$_id',
            original: {$push: '$original.items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.original.items' : 0,
        }},
        {$addFields: {
            'root.original.items': '$original'
        }},
        {$replaceRoot: {
            newRoot: '$root'
        }},
        {$unwind: '$updated.items'},
        {$lookup: {
            from: 'products',
            localField: 'updated.items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1
                }},
            ],
            as: 'updated.items.product'
        }},
        {$unwind: '$updated.items.product'},
        {$addFields: {
            'updated.items.name': '$updated.items.product.name'
        }},
        {$unset: 'updated.items.product'},
        {$group: {
            _id:'$_id',
            updated: {$push: '$updated.items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.updated.items' : 0,
        }},
        {$addFields: {
            'root.updated.items': '$updated'
        }},
        {$replaceRoot: {
            newRoot: '$root'
        }},
        {$sort: {createdAt: -1}}
    ])
    const delivery = Deliveries.find({salesId: quotationId})
    const invoices = Invoices.find({salesId: quotationId})
    Promise.all([
        quotation,
        activities,
        delivery,
        invoices
    ])
    .then(result => {
        res.status(200).json({
            quotation: result[0][0],
            activities: result[1],
            delivery: result[2],
            invoices: result[3]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.createQuotation = (req, res) => {
    const additionalCharges =  AdditionalCharges.find({status: true}).sort({name: '1'}).lean()
    const taxCodes =  TaxCode.find().sort({code: '1'}).lean()

    Promise.all([
        additionalCharges,
        taxCodes
    ])
    .then(result => {
        res.status(200).json({
            additionalCharges: result[0].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            taxCodes: result[1]
        });
    })

};

exports.postQuotation = (req, res) => {
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
    
    Sales.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
    .then(result => {
        if(result) {
            const no = result.quotationNo.substring(16)
            const newNo = parseInt(no) + 1
            newID = `${dd}${mm}/DPI/QUO/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/QUO/${yy}/1`
        }
        const quotation = new Sales({
            quotationNo: newID,
            customerId: req.body.customerId,
            billTo: req.body.customerId,
            shipTo: req.body.customerId,
            customerReference: req.body.customerReference,
            remarks: req.body.remarks,
            tags: req.body.tags,
            estimatedDeliveryTime: req.body.estimatedDeliveryTime,
            dateValidaty: req.body.dateValidaty,
            additionalCharges: req.body.additionalCharges,
            items: req.body.items,
            shipping: req.body.shipping.shipmentMethodId ? req.body.shipping:'',
            totalQty: req.body.totalQty,
            total: req.body.total,
            totalAdditionalCharges: req.body.totalAdditionalCharges,
            discount: req.body.discount,
            tax: req.body.tax,
            status: req.body.status,
            grandTotal: req.body.grandTotal,
            offerConditions: req.body.offerConditions,
            userId: req.user._id
        })
        return quotation.save()
    })
    .then(result => {
        activity('insert','Quotations', result.customerId, result._id, result.quotationNo, req.user._id, result, result)
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

exports.editQuotation = (req, res) => {
    const quotationId = mongoose.Types.ObjectId(req.params.quotationId);
    const additionalCharges =  AdditionalCharges.find({status: true}).sort({name: '1'}).lean()
    const taxCodes =  TaxCode.find().sort({code: '1'}).lean();
    const quotation = Sales.aggregate([
        {$match: {_id: quotationId}},
        {$lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            pipeline: [
                {$graphLookup: {
                    from: 'customers',
                    startWith: '$parentId',
                    connectFromField: 'parentId',
                    connectToField: '_id',
                    as: 'parents'
                }},
                {$unwind: {
                    path: '$parents',
                    preserveNullAndEmptyArrays: true
                }},
                {$sort: {'parents._id': 1}},
                {
                    $group: {
                        _id: "$_id",
                        parents: { $push: "$parents" },
                        parName: {$first: '$parents'},
                        root: { $first: "$$ROOT" }
                    }
                },
                {$project: {
                    parents: '$parents',
                    address: '$root.address',
                    displayName: {$cond: {
                        if: {$ifNull: ['$parName.name', false]},
                        then: {$concat: ['$parName.name', ', ', '$root.name']},
                        else: '$root.name'
                    }}
                }},
            ],
            as: 'customer'
        }},
        {$unwind: '$customer'},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                    stock: 1
                }},
            ],
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$addFields: {
            'items.name': '$items.product.name',
            'items.stock': '$items.product.stock'
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
    const activities = Activity.aggregate([
        {$match: {documentId: quotationId}},
        {$lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 1,
                    name: 1
                }}
            ],
            as: 'userId'
        }},
        {$unwind: '$userId'},
        {$unwind: '$original.items'},
        {$lookup: {
            from: 'products',
            localField: 'original.items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1
                }},
            ],
            as: 'original.items.product'
        }},
        {$unwind: '$original.items.product'},
        {$addFields: {
            'original.items.name': '$original.items.product.name'
        }},
        {$unset: 'original.items.product'},
        {$group: {
            _id:'$_id',
            original: {$push: '$original.items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.original.items' : 0,
        }},
        {$addFields: {
            'root.original.items': '$original'
        }},
        {$replaceRoot: {
            newRoot: '$root'
        }},
        {$unwind: '$updated.items'},
        {$lookup: {
            from: 'products',
            localField: 'updated.items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1
                }},
            ],
            as: 'updated.items.product'
        }},
        {$unwind: '$updated.items.product'},
        {$addFields: {
            'updated.items.name': '$updated.items.product.name'
        }},
        {$unset: 'updated.items.product'},
        {$group: {
            _id:'$_id',
            updated: {$push: '$updated.items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.updated.items' : 0,
        }},
        {$addFields: {
            'root.updated.items': '$updated'
        }},
        {$replaceRoot: {
            newRoot: '$root'
        }},
        {$sort: {createdAt: -1}}
    ])
    const delivery = Deliveries.find({salesId: quotationId})
    const invoices = Invoices.find({salesId: quotationId})
    Promise.all([
        additionalCharges,
        taxCodes,
        quotation,
        activities,
        delivery,
        invoices
    ])
    .then((result) => {
        res.status(200).json({
            additionalCharges: result[0].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            taxCodes: result[1],
            quotation: result[2][0],
            activities: result[3],
            delivery: result[4],
            invoices: result[5]
        })
    })

};

exports.duplicateQuotation = async (req, res) => {
    const quotationId = req.params.quotationId;
    const duplicate = await Sales.findById(quotationId);
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
    
    Sales.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
    .then(result => {
        if(result) {
            const no = result.no.substring(16)
            const newNo = parseInt(no) + 1
            newID = `${dd}${mm}/DPI/QUO/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/QUO/${yy}/1`
        }
        const quotation = new Quotations({
            no: newID,
            remarks: duplicate.remarks,
            tags: duplicate.tags,
            estimatedDeliveryDate: duplicate.estimatedDeliveryDate,
            dateValidaty: duplicate.dateValidaty,
            creditTermId: duplicate.creditTermId,
            shipmentTermId: duplicate.shipmentTermId,
            shipmentMethodId: duplicate.shipmentMethodId,
            shipmentService: duplicate.shipmentService,
            shipmentCost: duplicate.shipmentCost,
            additionalCharges: duplicate.additionalCharges,
            items: duplicate.items,
            totalQty: duplicate.totalQty,
            total: duplicate.total,
            totalAdditionalCharges: duplicate.totalAdditionalCharges,
            discount: duplicate.discount,
            tax: duplicate.tax,
            status: 'New',
            grandTotal: duplicate.grandTotal,
            offerConditions: duplicate.offerConditions,
            userId: req.user._id
        })
        return quotation.save()
    })
    .then(result => {
        activity('insert','Quotations', result.customerId, result._id, result.no, req.user._id, result, result)
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.putQuotation = async (req, res) => {
    const quotationId = req.params.quotationId;
    const original = await Sales.findById(quotationId).lean()
    Sales.findById(quotationId)
    .then(quotation => {
            quotation.customerId = req.body.customerId
            quotation.billTo = req.body.customerId
            quotation.shipTo = req.body.customerId
            quotation.customerReference = req.body.customerReference
            quotation.remarks = req.body.remarks
            quotation.tags = req.body.tags
            quotation.estimatedDeliveryTime = req.body.estimatedDeliveryTime
            quotation.dateValidaty = req.body.dateValidaty
            quotation.additionalCharges = req.body.additionalCharges
            quotation.items = req.body.items
            if(req.body.shipping.shipmentMethodId) {
                quotation.shipping = req.body.shipping
            } else {
                quotation.shipping = undefined
            }
            quotation.totalQty = req.body.totalQty
            quotation.total = req.body.total
            quotation.totalAdditionalCharges = req.body.totalAdditionalCharges
            quotation.discount = req.body.discount
            quotation.tax = req.body.tax
            quotation.grandTotal = req.body.grandTotal
            quotation.offerConditions = req.body.offerConditions
        return quotation.save()
    })
    .then(result => {
        activity('update','Quotations', result.customerId, result._id, result.quotationNo, req.user._id, original, result)
        res.status(200).json(result)
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    })
};

exports.cancelQuotation = async (req, res) => {
    const quotationId = req.params.quotationId;
    let original;
    Sales.findById(quotationId)
    .then(quotation => {
        let items = quotation.items.map(obj => {
            obj.delivered = 0
            return obj
        })
        original = quotation
        quotation.status = 'Cancelled'
        quotation.items = items
        return quotation.save()
    })
    .then( async (result) => {
        await Deliveries.updateMany({salesId: quotationId}, {status: 'Cancelled'})
        activity('cancelled','Quotations', result.customerId, result._id, result.quotationNo, req.user._id, original, result)
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}
exports.setToQuotation = (req, res) => {
    const quotationId = req.params.quotationId;
    let original;
    Sales.findById(quotationId)
    .then(quotation => {
        original = quotation
        quotation.status = 'Quotation'
        return quotation.save()
    })
    .then(result => {
        activity('settoquotation','Quotations', result.customerId, result._id, result.quotationNo, req.user._id, original, result)
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}
exports.confirmQuotation = async (req, res) => {
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
    const quotationId = req.params.quotationId;
    let original;
    Sales.findById(quotationId)
    .then(async (quotation) => {
        let items = quotation.items.map(obj => {
            obj.status = true
            return obj
        })
        let sales = await Sales.findOne({$and:[{salesNo: {$exists: true}}, {salesNo: {$ne: null}}, {salesCreated: {$gte: today}}]}).sort({salesCreated: -1})
        let newID;
        if(sales) {
            const no = sales.salesNo.substring(15)
            const newNo = parseInt(no)+1
            newID = `${dd}${mm}/DPI/SO/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/SO/${yy}/1`
        }
        original = quotation
        quotation.salesNo = newID
        quotation.salesCreated = date
        quotation.status = 'Sales Order'
        quotation.items = items
        quotation.invoiceStatus = 'Nothing to Invoice'
        return quotation.save()
    })
    .then(async (result) => {
        await moduleDelivery(result, req.user._id)
        activity('confirm','Quotations', result.customerId, result._id, result.quotationNo, req.user._id, original, result)
        res.status(200).json(result)
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    })
}


