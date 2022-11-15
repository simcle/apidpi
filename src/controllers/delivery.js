const mongoose = require('mongoose');
const Delivery = require('../models/delivery');
const Inventories = require('../models/inventory');
const Warehouses = require('../models/warehouse');
const updateStock = require('../modules/updateStock');
const Sales = require('../models/sales');
const moduleDelivery = require('../modules/delivery');
const Shippings = require('../models/shipping');
const activity = require('../modules/activityHistory');
const SerialNumbers = require('../models/serialNumbers');
const stockCards = require('../modules/stockCard');

exports.getDelivery = (req, res) => {
    const search = req.query.search
    const filter = req.query.filter
    const currentPage = req.query.page || 1
    const perPage = req.query.perPage || 20
    const salesId = req.query.salesId
    let query;
    let sales;
    if(filter) {
        query = {status: {$in: filter}}
    } else {
        query = {}
    }
    if(salesId) {
        sales = {salesId: mongoose.Types.ObjectId(salesId)}
    } else {
        sales = {}
    }
    let totalItems;
    Delivery.aggregate([
        {$lookup: {
            from: 'warehouses',
            localField: 'warehouseId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    code: 1
                }}
            ],
            as: 'warehouseId'
        }},
        {$unwind: '$warehouseId'},
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
            as: 'customerId'
        }},
        {$unwind: '$customerId'},
        {$lookup: {
            from: 'sales',
            localField: 'salesId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    salesNo: 1
                }}
            ],
            as: 'sales'
        }},
        {$unwind: '$sales'},
        {$addFields: {
            'warehouse': '$warehouseId.code',
            'customer': '$customerId.displayName',
            'salesNo': '$sales.salesNo'
        }},
        {$project: {
            warehouseId: 0,
            customerId: 0,
        }},
        {$match: {
            $and: [{$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {deliveryNo: {$regex: '.*'+search+'.*', $options: 'i'}}, {salesNo: {$regex: '.*'+search+'.*', $options: 'i'}}]}, query, sales]
        }},
        {$count: 'count'}
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return Delivery.aggregate([
            {$lookup: {
                from: 'warehouses',
                localField: 'warehouseId',
                foreignField: '_id',
                pipeline: [
                    {$project: {
                        code: 1
                    }}
                ],
                as: 'warehouseId'
            }},
            {$unwind: '$warehouseId'},
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
                as: 'customerId'
            }},
            {$unwind: '$customerId'},
            {$lookup: {
                from: 'sales',
                localField: 'salesId',
                foreignField: '_id',
                pipeline: [
                    {$project: {
                        salesNo: 1
                    }}
                ],
                as: 'sales'
            }},
            {$unwind: '$sales'},
            {$addFields: {
                'warehouse': '$warehouseId.code',
                'customer': '$customerId.displayName',
                'salesNo': '$sales.salesNo',
            }},
            {$project: {
                warehouseId: 0,
                customerId: 0,
            }},
            {$match: {
                $and: [{$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {deliveryNo: {$regex: '.*'+search+'.*', $options: 'i'}}, {salesNo: {$regex: '.*'+search+'.*', $options: 'i'}}]}, query, sales]
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
        console.log(err);
        res.status(400).send(err)
    })
}

exports.getDetailDelivery = async (req, res) => {
    const deliveryId = mongoose.Types.ObjectId(req.params.deliveryId);
    let warehouseId = await Warehouses.findOne({isDefault: true}).select('_id');
    const delivery = Delivery.aggregate([
        {$match: {_id: deliveryId}},
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
        {$lookup: {
            from: 'shippings',
            localField: 'shipping.shipmentMethodId',
            foreignField: '_id',
            as: 'shipping.name'
        }},
        {$unwind: {
            path: '$shipping.name',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'sales',
            localField: 'salesId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    salesNo: 1
                }}
            ],
            as: 'sales'
        }},
        {$unwind: '$sales'},
        {$addFields: {
            'salesNo': '$sales.salesNo'
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
                }},
            ],
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$lookup: {
            from: 'inventories',
            localField: 'items.productId',
            foreignField: 'productId',
            pipeline: [
                {$match: {
                    $expr: {
                        $and: [
                            {$eq: ['$isDefault', true]},
                            {$eq: ['$warehouseId', warehouseId._id]}
                        ]
                    }
                }},
                {$project: {
                    _id: 0,
                    qty: 1
                }}
            ],
            as: 'items.product.stock'
        }},
        {$unwind: {
            path: '$items.products.stock',
            preserveNullAndEmptyArrays: true
        }},
        {$addFields: {
            'items.name': '$items.product.name',
            'items.stock': '$items.product.stock.qty',
        }},
        {$unset: 'items.product'},
        {$group: {
            _id: '$_id',
            items: {$push: '$items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.items' : 0,
            'root.sales' : 0
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
    const shippings = Shippings.find({status: true}).sort({name: '1'}).lean()
    Promise.all([
        delivery,
        shippings
    ])
    .then(result => {
        res.status(200).json({
            delivery: result[0][0],
            shippings: result[1].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),

        })
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.updateDelivery = (req, res) => {
    const deliveryId = req.params.deliveryId
    Delivery.findById(deliveryId)
    .then(delivery => {
        delivery.scheduled = req.body.scheduled
        delivery.items = req.body.items
        if(req.body.shipping.shipmentMethodId) {
            delivery.shipping = req.body.shipping
        } else {
            delivery.shipping.bookingCode = req.body.shipping.bookingCode
            delivery.shipping.trackingNumber = req.body.shipping.trackingNumber
        }
        return delivery.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.validateDelivery = (req, res) => {
    const deliveryId = req.params.deliveryId
    const items = req.body
    let delivered;
    Delivery.findById(deliveryId)
    .then(delivery => {
        delivery.status = 'Delivery'
        delivery.items = items
        return delivery.save()
    })
    .then(delivery => {
        delivered = delivery
        const salesId = delivery.salesId
        return Sales.findById(salesId)
    })
    .then(sales => {
        let products = sales.items
        for(let i=0; i < products.length; i++) {
            for(let a=0; a < items.length; a++) {
                if(products[i].idx == items[a].idx) {
                    products[i].delivered = products[i].delivered + items[i].done
                }
            }
        }
        sales.invoiceStatus = 'To Invoice'
        return sales.save()
    })
    .then(async (sales) => {
        const warehouseId = delivered.warehouseId
        const documentId = sales._id
        const documentName = 'Sales Order'
        const documentNo = sales.salesNo
        for (let i=0; i < items.length; i++ ) {
            let item = items[i]
            if(item.isSerialNumber) {
                for (let s=0; s < item.serialNumber.length; s++) {
                    let sn = item.serialNumber[s]
                    let serial = await SerialNumbers.findOne({$and: [{serialNumber: sn.sn}, {productId: item.productId}]})
                    if(serial) {
                        serial.documentOut.push({documentId: documentId, documentName: documentName, documentNo: documentNo})
                        await serial.save()
                    } else {
                        const newSerial = new SerialNumbers({
                            productId: item.productId,
                            serialNumber: sn.sn,
                            documentOut: [{documentId: documentId, documentName: documentName, documentNo: documentNo}]
                        })
                        await newSerial.save()
                    }
                }
            }
            let inventory = await Inventories.findOne({$and: [{warehouseId: warehouseId}, {isDefault: true}, {productId: items[i].productId}]})
            if(inventory) {
                let qty = inventory.qty - item.done
                inventory.qty = qty
                await inventory.save()
                await stockCards('out', inventory.warehouseId, item.productId, documentId, 'Sales Order', item.qty, qty)
                await updateStock(inventory.productId)
            }
        }
        res.status(200).json(sales)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.createBackOrder = async (req, res) => {
    let backorder = req.body
    let userId = req.user._id
    await moduleDelivery(backorder, userId)
    res.status(200).json('OK')
}

exports.updateTrackingNumber = (req, res) => {
    const deliveryId = req.params.deliveryId
    const trackingNumber = req.body.trackingNumber
    Delivery.findById(deliveryId)
    .then(delivery => {
        delivery.shipping.trackingNumber = trackingNumber
        delivery.status = 'Done'
        return delivery.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}