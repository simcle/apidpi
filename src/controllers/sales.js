const mongoose = require('mongoose');
const Customers = require('../models/customers');
const CreditTerms = require('../models/creditTerm');
const ShipmentTerms = require('../models/shipmentTerm');
const ShipmentMethods = require('../models/shipping');
const AdditionalCharges = require('../models/additionalCharge');
const TaxCode = require('../models/taxCode');
const Produts = require('../models/products');
const Sales = require('../models/sales');
const Invoices = require('../models/invoice');
const Activity = require('../models/activity');
const Task = require('../models/tasks');
const activity = require('../modules/activityHistory');
const Deliveries = require('../models/delivery');
const moduleDelivery = require('../modules/delivery');
const PaymentTerm = require('../models/paymentTerm');

exports.getSales = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search;
    const filter = req.query.filter;
    let totalItems;
    let query;
    if(filter) {
        query = {invoiceStatus: {$in: filter}}
    } else {
        query = {}
    }
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
        {$match: {
            $and: [{status: 'Sales Order'}, {$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {salesNo: {$regex: '.*'+search+'.*', $options:'i'}}]}, query]
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
            {$match: {
                $and: [{status: 'Sales Order'}, {$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {salesNo: {$regex: '.*'+search+'.*', $options:'i'}}]}, query]
            }},
            {$sort: {salesCreated: -1}},
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

exports.getDetailSales = (req, res) => {
    const salesId = mongoose.Types.ObjectId(req.params.salesId);
    const quotation = Sales.aggregate([
        {$lookup: {
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
        {$match: {_id: salesId}},
        {$lookup: {
            from: 'customers',
            localField: 'billTo',
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
                {$graphLookup: {
                    from: 'customers',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'attn'
                }},
                {$unwind: {
                    path: '$attn',
                    preserveNullAndEmptyArrays: true
                }},
                {$sort: {'parents._id': 1}},
                {
                    $group: {
                        _id: "$_id",
                        parents: { $first: "$parents" },
                        attn: {$first: "$attn"},
                        root: { $first: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        parent: '$parents.name',
                        attn: '$attn.name',
                        name: '$root.name',
                        address: '$root.address',
                        contact: '$root.contact',
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
            as: 'billTo'
        }},
        {$unwind: '$billTo'},
        {$lookup: {
            from: 'customers',
            localField: 'shipTo',
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
                {$graphLookup: {
                    from: 'customers',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'attn'
                }},
                {$unwind: {
                    path: '$attn',
                    preserveNullAndEmptyArrays: true
                }},
                {$sort: {'parents._id': 1}},
                {
                    $group: {
                        _id: "$_id",
                        parents: { $first: "$parents" },
                        attn: {$first: "$attn"},
                        root: { $first: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        parent: '$parents.name',
                        attn: '$attn.name',
                        name: '$root.name',
                        address: '$root.address',
                        contact: '$root.contact',
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
            as: 'shipTo'
        }},
        {$unwind: '$shipTo'},
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
        {$lookup: {
            from: 'paymentterms',
            foreignField: '_id',
            localField: 'paymentTermId',
            as: 'paymentTerm'
        }},
        {$unwind: {

            path: '$paymentTerm',
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
        {$match: {documentId: salesId}},
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
    const delivery = Deliveries.find({salesId: salesId})
    const invoices = Invoices.find({salesId: salesId})
    Promise.all([
        quotation,
        activities,
        delivery,
        invoices
    ])
    .then(result => {
        res.status(200).json({
            sales: result[0][0],
            activities: result[1],
            delivery: result[2],
            invoices: result[3]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.editSales = (req, res) => {
    const salesId = mongoose.Types.ObjectId(req.params.salesId);
    const paymentTerms = PaymentTerm.find().lean();
    const additionalCharges =  AdditionalCharges.find({status: true}).sort({name: '1'}).lean();
    const taxCodes =  TaxCode.find().sort({code: '1'}).lean();
    const sales = Sales.aggregate([
        {$match: {_id: salesId}},
        {$lookup: {
            from: 'customers',
            localField: 'billTo',
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
            as: 'billTo'
        }},
        {$unwind: '$billTo'},
        {$lookup: {
            from: 'customers',
            localField: 'shipTo',
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
            as: 'shipTo'
        }},
        {$unwind: '$shipTo'},
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
        {$match: {documentId: salesId}},
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
    const delivery = Deliveries.find({salesId: salesId})
    const invoices = Invoices.find({salesId: salesId})
    Promise.all([
        additionalCharges,
        taxCodes,
        sales,
        activities,
        delivery,
        invoices,
        paymentTerms
    ])
    .then((result) => {
        res.status(200).json({
            additionalCharges: result[0].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            taxCodes: result[1],
            sales: result[2][0],
            activities: result[3],
            delivery: result[4],
            invoices: result[5],
            paymentTerms: result[6].map(obj => {
                obj.id = obj._id,
                obj.text = obj.code
                return obj
            })
        })
    })

};
exports.updateSales = async (req, res) => {
    const salesId = req.params.salesId;
    const original = await Sales.findById(salesId).lean()

    Sales.findById(salesId)
    .then(sales => {
            const invoiced = req.body.items.filter(obj => obj.qty > obj.invoiced)
            const items = req.body.items
            items.map(obj => {
                obj.status = true
                return obj
            })
            if(invoiced.length > 0) {
                sales.invoiceStatus = 'To Invoice'
            }
            sales.customerId = req.body.billTo
            sales.billTo = req.body.billTo
            sales.shipTo = req.body.shipTo
            sales.customerPO = req.body.customerPO
            sales.remarks = req.body.remarks
            sales.tags = req.body.tags
            sales.estimatedDeliveryTime = req.body.estimatedDeliveryTime
            sales.dateValidaty = req.body.dateValidaty
            sales.additionalCharges = req.body.additionalCharges
            if(req.body.paymentTermId) {
                sales.paymentTermId = req.body.paymentTermId
            }
            sales.items = items
            if(req.body.shipping.shipmentMethodId) {
                sales.shipping = req.body.shipping
            } else {
                sales.shipping = undefined
            }
            sales.totalQty = req.body.totalQty
            sales.total = req.body.total
            sales.totalAdditionalCharges = req.body.totalAdditionalCharges
            sales.discount = req.body.discount
            sales.tax = req.body.tax
            sales.grandTotal = req.body.grandTotal
            sales.offerConditions = req.body.offerConditions
        return sales.save()
    })
    .then(async (result) => {
        activity('update','Sales Orders', result.customerId, result._id, result.salesNo, req.user._id, original, result)
        const invoice = Invoices.findOne({salesId: result._id})
        .then(async (result) => {
            if(result) {
                result.shipTo = req.body.shipTo
                result.billTo = req.body.billTo
                result.amountDue = req.body.grandTotal
                if(req.body.paymentTermId) {
                    result.paymentTermId = req.body.paymentTermId
                }
                if(req.body.shipping.shipmentMethodId) {
                    result.shipping = req.body.shipping
                } else {
                    result.shipping = undefined
                }
                await result.save()
            }
        })
        const items = result.items
        items.map(obj => {
            if(obj.delivered > 0) {
                obj.qty = obj.qty - obj.delivered
            } 
            return obj  
        })
        result.items = items
        let deliveryItems = items.filter(obj => obj.qty > 0)
        const delivery = await Deliveries.findOne({$and: [{salesId: salesId}, {status: 'Ready'}]})
        if(delivery) {
            delivery.items = deliveryItems
            delivery.shipping = result.shipping
            await delivery.save()
        } else {
            if(deliveryItems.length > 0) {
                await moduleDelivery(result, req.user._id)
            }
        }
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
};