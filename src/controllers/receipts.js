const mongoose = require('mongoose');
const Receipts = require('../models/receipts');
const Purchases = require('../models/purchases');
const Inventories = require('../models/inventory');
const SerialNumbers = require('../models/serialNumbers');
const stockCards = require('../modules/stockCard');
const updateStock = require('../modules/updateStock');
const receiveProduct = require('../modules/receive');

exports.getReceipts = (req, res) => {
    const search = req.query.search
    const filters = req.query.filters
    const currentPage = req.query.page || 1
    const perPage = req.query.perPage || 20
    const purchaseId = req.query.purchaseId
    let query;
    let purchase;
    if(filters) {
        query = {status: {$in: filters}}
    } else {
        query = {}
    }
    if(purchaseId) {
        purchase = {purchaseId: mongoose.Types.ObjectId(purchaseId)}
    } else {
        purchase = {}
    }
    let totalItems;
    Receipts.aggregate([
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
            from: 'purchases',
            foreignField: '_id',
            localField: 'purchaseId',
            pipeline: [
                {$project: {
                    _id: 0,
                    no: 1
                }}
            ],
            as: 'purchase'
        }},
        {$unwind: '$purchase'},
        {$addFields: {
            warehouse: '$warehouseId.code',
            supplier: '$supplier.name',
            purchase: '$purchase.no'
        }},
        {$match: {
            $and: [{$or: [{supplier: {$regex: '.*'+search+'.*', $options: 'i'}}, {receiveNo: {$regex: '.*'+search+'.*', $options: 'i'}}, {purchase: {$regex: '.*'+search+'.*', $options: 'i'}}]}, query, purchase]
        }},
        {$count: 'count'}
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return Receipts.aggregate([
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
                from: 'purchases',
                foreignField: '_id',
                localField: 'purchaseId',
                pipeline: [
                    {$project: {
                        _id: 0,
                        no: 1
                    }}
                ],
                as: 'purchase'
            }},
            {$unwind: '$purchase'},
            {$addFields: {
                warehouse: '$warehouseId.code',
                supplier: '$supplier.name',
                purchase: '$purchase.no'
            }},
            {$match: {
                $and: [{$or: [{supplier: {$regex: '.*'+search+'.*', $options: 'i'}}, {receiveNo: {$regex: '.*'+search+'.*', $options: 'i'}}, {purchase: {$regex: '.*'+search+'.*', $options: 'i'}}]}, query, purchase]
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

exports.detailReceive = (req, res) => {
    const receiveId = mongoose.Types.ObjectId(req.params.receiveId);
    Receipts.aggregate([
        {$match: {_id: receiveId}},
        {$lookup: {
            from: 'purchases',
            foreignField: '_id',
            localField: 'purchaseId',
            pipeline:[
                {$project: {
                    _id: 0,
                    no: 1
                }}
            ],
            as: 'purchase'
        }},
        {$unwind: '$purchase'},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                    isSerialNumber: 1
                }},
            ],
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$addFields: {
            purchase: '$purchase.no',
            'items.name': '$items.product.name',
            'items.isSerialNumber': '$items.product.isSerialNumber'
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
    .then(result => {
        res.status(200).json(result[0])
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.updateReceive = (req, res) => {
    const receiveId = req.params.receiveId
    Receipts.findById(receiveId)
    .then(receive => {
        receive.items = req.body.items
        return receive.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.confirmReceive = (req, res) => {
    const receiveId = req.params.receiveId
    Receipts.findById(receiveId)
    .then(receive => {
        receive.status = 'To Validate'
        return receive.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.setToReady = (req, res) => {
    const receiveId = req.params.receiveId
    Receipts.findById(receiveId)
    .then(receive => {
        receive.status = 'Ready'
        return receive.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}
exports.validateReceive = (req, res) => {
    const receiveId = req.params.receiveId
    const items = req.body.items
    let received;
    Receipts.findById(receiveId)
    .then(receive => {
        receive.status = 'Done'
        receive.items = items
        return receive.save()
    })
    .then(receive => {
        received = receive
        const purchaseId = receive.purchaseId
        return Purchases.findById(purchaseId)
    })
    .then(purchase => {
        const products = purchase.items
        for(let i=0; i < products.length; i++) {
            for(let a=0; a < items.length; a++) {
                if(products[i].idx == items[a].idx) {
                    products[i].received = products[i].received + items[a].done
                }
            }
        }
        purchase.receiveStatus = req.body.receiveStatus
        return purchase.save()
    })
    .then(async (purchase) => {
        const warehouseId = received.warehouseId
        const documentId = purchase._id
        const documentName = 'Purchase Order'
        const documentNo = purchase.no
        for (let i=0; i < items.length; i++ ) {
            let item = items[i]
            if(item.isSerialNumber) {
                for (let s=0; s < item.serialNumber.length; s++) {
                    let sn = item.serialNumber[s]
                    let serial = await SerialNumbers.findOne({$and: [{serialNumber: sn.sn}, {productId: item.productId}]})
                    if(serial) {
                        serial.status = 'In Stock',
                        serial.documentIn.push({documentId: documentId, documentNo: documentNo, documentName: documentName})
                        await serial.save()
                    } else {
                        const newSerial = new SerialNumbers({
                            productId: item.productId,
                            serialNumber: sn.sn,
                            status: 'In Stock',
                            documentIn: [{documentId: documentId, documentNo: documentNo, documentName: documentName}]
                        })
                        await newSerial.save()
                    }
                }
            }
            let inventory = await Inventories.findOne({$and: [{warehouseId: warehouseId}, {isDefault: true}, {productId: items[i].productId}]})
            if(inventory) {
                let qty = inventory.qty + item.done
                inventory.qty = qty
                await inventory.save()
                await stockCards('in', inventory.warehouseId, item.productId, documentId, 'Purchase Order', item.done, qty)
                await updateStock(inventory.productId)
            }
        }
        res.status(200).json(purchase)
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    })
}

exports.createBackOrder = async (req, res) => {
    let backorder = req.body
    let userId = req.user._id
    await receiveProduct(backorder, userId)
    res.status(200).json('OK')
}