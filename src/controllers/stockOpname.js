const Warehouses = require('../models/warehouse');
const Inventories = require('../models/inventory');
const StockOpnames = require('../models/stockOpname');
const updateStock = require('../modules/updateStock');
const stockCard = require('../modules/stockCard');
const Products = require('../models/products');

const mongoose = require('mongoose');

exports.getStockOpname = (req, res) => {
    const search = req.query.search
    const filters = req.query.filters
    const currentPage = req.query.page || 1
    const perPage = req.query.perPage || 20
    let totalItems;
    let query;
    if(filters) {
        query = {status: {$in: filters}}
    } else {
        query = {}
    }
    StockOpnames.aggregate([
        {$lookup: {
            from: 'warehouses',
            foreignField:'_id',
            localField: 'warehouseId',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1
                }}
            ],
            as: 'warehouse',
        }},
        {$unwind: {
            path: '$warehouse',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'users',
            foreignField: '_id',
            localField: 'userId',
            pipeline:[
                {$project: {
                    _id: 0,
                    name: 1
                }}
            ],
            as: 'user'
        }},
        {$unwind: '$user'},
        {$addFields: {
            warehouse: '$warehouse.name',
            user: '$user.name'
        }},
        {$match: {$and: [{stockOpnameNo: {$regex: '.*'+search+'.*', $options: 'i'}}, query]}},
        {$count: 'count'}
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return StockOpnames.aggregate([
            {$lookup: {
                from: 'warehouses',
                foreignField:'_id',
                localField: 'warehouseId',
                pipeline: [
                    {$project: {
                        _id: 0,
                        name: 1
                    }}
                ],
                as: 'warehouse',
            }},
            {$unwind: {
                path: '$warehouse',
                preserveNullAndEmptyArrays: true
            }},
            {$lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'userId',
                pipeline:[
                    {$project: {
                        _id: 0,
                        name: 1
                    }}
                ],
                as: 'user'
            }},
            {$unwind: '$user'},
            {$addFields: {
                warehouse: '$warehouse.name',
                user: '$user.name'
            }},
            {$match: {$and: [{stockOpnameNo: {$regex: '.*'+search+'.*', $options: 'i'}}, query]}},
            {$sort: {createdAt: -1}},
            {$skip: (currentPage -1) * perPage},
            {$limit: perPage}
        ])
    })
    .then (result => {
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
}

exports.createStockOpname = (req, res) => {
    Warehouses.find().lean()
    .then(result => {
        const warehouses = result.map(obj => {
            obj.id = obj._id
            obj.text = obj.name
            return obj
        })
        res.status(200).json(warehouses)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.searchProduct = (req, res) => {
    const warehouseId = mongoose.Types.ObjectId(req.query.warehouseId)
    const search = req.query.search
    const params = req.query.notin
    const ids = []
    let query;
    for (let pr of params) {
        if(pr) {
            ids.push(mongoose.Types.ObjectId(pr))
        }
    }
    if(!search) {
        query = {$and: [{warehouseId: warehouseId}, {productId: {$nin: ids}}]}
    } else {
        query = {$and: [{warehouseId: warehouseId}, {productId: {$nin: ids}}, {$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}]}]}
    }
    Inventories.aggregate([
        {$lookup: {
            from: 'products',
            foreignField: '_id',
            localField: 'productId',
            pipeline: [
                {$project: {
                    name: 1,
                    isSerialNumber: 1,
                    images: 1,
                    sku: 1
                }}
            ],
            as: 'product'
        }},
        {$unwind: '$product'},
        {$project: {
            productId: 1,
            name: '$product.name',
            images: '$product.images',
            sku: '$product.sku',
            isSerialNumber: '$product.isSerialNumber',
            stock: '$$ROOT.qty',
            warehouseId: 1
        }},
        {$match: query},
        {$limit: 10},
    ])
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.getProducts = (req, res) => {
    const warehouseId = mongoose.Types.ObjectId(req.query.warehouseId)
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search
    const params = req.query.notin
    const ids = []
    let query;
    for (let pr of params) {
        if(pr) {
            ids.push(mongoose.Types.ObjectId(pr))
        }
    }
    if(!search) {
        query = {$and: [{warehouseId: warehouseId}, {productId: {$nin: ids}}]}
    } else {
        query = {$and: [{warehouseId: warehouseId}, {productId: {$nin: ids}}, {$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}]}]}
    }
    let totalItems;
    Inventories.aggregate([
        {$lookup: {
            from: 'products',
            foreignField: '_id',
            localField: 'productId',
            pipeline: [
                {$project: {
                    name: 1,
                    isSerialNumber: 1,
                    images: 1,
                    sku: 1
                }}
            ],
            as: 'product'
        }},
        {$unwind: '$product'},
        {$project: {
            productId: 1,
            name: '$product.name',
            images: '$product.images',
            sku: '$product.sku',
            stock: '$$ROOT.qty',
            warehouseId: 1
        }},
        {$match: query},
        {$count: 'count'},
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return Inventories.aggregate([
            {$lookup: {
                from: 'products',
                foreignField: '_id',
                localField: 'productId',
                pipeline: [
                    {$project: {
                        name: 1,
                        isSerialNumber: 1,
                        images: 1,
                        sku: 1
                    }}
                ],
                as: 'product'
            }},
            {$unwind: '$product'},
            {$project: {
                productId: 1,
                name: '$product.name',
                images: '$product.images',
                isSerialNumber: '$product.isSerialNumber',
                sku: '$product.sku',
                stock: '$$ROOT.qty',
                warehouseId: 1
            }},
            {$match: query},
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
        res.status(400).send(err)
    })
}

exports.insertStockOpname = (req, res) => {
    const stockopname = new StockOpnames({
        stockOpnameNo: 'In Progress',
        warehouseId: req.body.warehouseId,
        remarks: req.body.remarks,
        items: req.body.items,
        status: 'In Progress',
        userId: req.body.userId
    })
    stockopname.save()
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.editStockOpname = (req, res) => {
    const stockOpnameId = mongoose.Types.ObjectId(req.params.stockOpnameId)
    StockOpnames.aggregate([
        {$match: {_id: stockOpnameId}},
        {$lookup: {
            from: 'users',
            foreignField: '_id',
            localField: 'userId',
            pipeline:[
                {$project: {
                    _id: 0,
                    name: 1
                }}
            ],
            as:'users'
        }},
        {$unwind: '$users'},
        {$lookup: {
            from: 'warehouses',
            localField: 'warehouseId',
            foreignField: '_id',
            pipeline:[
                {$project: {
                    _id: 0,
                    name: 1
                }}
            ],
            as: 'warehouses'
        }},
        {$unwind: '$warehouses'},
        {$addFields: {
            warehouse: '$warehouses.name',
            user: '$users.name'
        }},
        {$unset: 'warehouses'},
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
            'root.users': 0
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

exports.updateStockOpname = (req, res) => {
    const stockOpnameId = req.params.stockOpnameId
    StockOpnames.findById(stockOpnameId)
    .then(so => {
        so.items = req.body.items
        return so.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.validateStockOpname = (req, res) => {
    const stockOpnameId = req.params.stockOpnameId;
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
    StockOpnames.findOne({validated: {$gte: today}}).sort({validated: -1})
    .then(result => {
        if(result) {
            const no = result.stockOpnameNo.substring(18)
            const newNo = parseInt(no) + 1
            newID = `${dd}${mm}/DPI/STOCK/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/STOCK/${yy}/1`
        }
        return StockOpnames.findById(stockOpnameId)
    })
    .then(stockOpname => {
        stockOpname.stockOpnameNo = newID
        stockOpname.validated = new Date()
        stockOpname.items = req.body.items
        stockOpname.status = 'Validated'
        return stockOpname.save()
    })
    .then(async (result) => {
        const warehouseId = result.warehouseId
        const items = result.items
        for (let i=0; i < items.length; i++) {
            let item = items[i]
            let inventory = await Inventories.findOne({$and: [{warehouseId: warehouseId}, {productId: item.productId}]})
            inventory.qty += item.difference
            await inventory.save()
            if(item.isSerialNumber) {
                let product = await Products.findById(item.productId)
                product.isSerialNumber = item.isSerialNumber
                await product.save()
            }
            if(item.difference < 0) {
                await stockCard('out', warehouseId, item.productId, result._id, 'Stock Opname', item.difference, inventory.qty)
            } else {
                await stockCard('in', warehouseId, item.productId, result._id, 'Stock Opname', item.difference, inventory.qty)
            }
            await updateStock(item.productId)
        }
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}