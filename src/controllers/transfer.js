const mongoose = require('mongoose');
const Warehouse = require('../models/warehouse');
const Product = require('../models/products');
const Inventory = require('../models/inventory');
const Transfer = require('../models/transfer');

exports.getTransfer = async(req, res) => {
    const search = req.query.search;
    const warehouse = await Warehouse.find({name: {$regex: '.*'+search+'.*', $options: 'i'}}).select('_id')
    const warehouseId = warehouse.map(obj => obj._id.toString())
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    let totalItems;
    Transfer.find({$or: [{no: {$regex: '.*'+search+'.*', $options: 'i'}}, {fromWarehouseId: {$in: warehouseId}}, {toWarehouseId: {$in: warehouseId}}]})
    .countDocuments()
    .then(count => {
        totalItems = count
        return Transfer.find({$or: [{no: {$regex: '.*'+search+'.*', $options: 'i'}}, {fromWarehouseId: {$in: warehouseId}}, {toWarehouseId: {$in: warehouseId}}]})
        .populate('fromWarehouseId', 'name')
        .populate('toWarehouseId', 'name')
        .populate('userId', 'name')
        .skip((currentPage -1) * perPage)
        .limit(perPage)
        .sort({createdAt: -1});
    })
    .then(result => {
        const last_page = Math.ceil(totalItems / perPage)
        res.status(200).json({
            data: result,
            pages: {
                current_page: currentPage,
                last_page: last_page
            }
        })
    })
    .catch(err => {
        res.status(400).send(err)
    });
};

exports.getDetailTransfer = (req, res) => {
    const transferId = req.params.transferId;
    Transfer.findById(transferId)
    .populate('fromWarehouseId')
    .populate('toWarehouseId')
    .populate('items.productId', 'name images sku')
    .populate('items.fromSectionId', 'name')
    .populate('items.toSectionId', 'name')
    .populate('userId')
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.createTransfer = (req, res) => {
    Warehouse.find({status: true}).populate('sections').sort({name: 'asc'})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

exports.editTransfer = (req, res) => {
    const transferId = req.params.transferId;
    Transfer.findById(transferId)
    .populate({
        path: 'fromWarehouseId',
        populate: {
            path: 'sections'
        }
    })
    .populate({
        path: 'toWarehouseId',
        populate: {
            path:'sections'
        }
    })
    .populate('items.productId', 'name')
    .populate('items.fromSectionId', 'name')
    .populate('items.toSectionId', 'name')
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
},

exports.getProduct = async (req, res) => {
    const search = req.query.search;
    const params = req.query.notin;
    const warehouseId = mongoose.Types.ObjectId(req.params.warehouseId);
    let ids = [];
    for await (let pr of params) {
        if(pr) {
            ids.push(mongoose.Types.ObjectId(pr))
        }
    }
    const inventory = await Inventory.find({$and: [{warehouseId: warehouseId}, {productId:{$in: ids}}]}).lean()
    if(inventory.length > ids.length) {
        
        let pr = params.filter((x, i) => params.indexOf(x) === i)
        let inv = inventory.map(obj => {
            return obj.productId.toString()
        })
        let result = []
        for await (let a of pr) {
            let b = inv.filter(obj => {return obj == a})
            let c = params.filter(obj => {return obj == a})
            if(b.length > c.length) {
                result.push(a)
            }
        }
        ids = ids.filter(obj => !result.includes(obj.toString()))
    }

    Product.aggregate([
        {$match: {$or:[{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}], _id: {$nin: ids}}},
        {$lookup: {
            from: 'inventories',
            localField: '_id',
            foreignField: 'productId',
            pipeline: [
                {
                    $match: {warehouseId: warehouseId}
                }
            ],
            as: 'inventory'
        }},
        {$match: {inventory: {$ne: []}}}
    ])
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
    
};

exports.getInventory =  (req, res) => {
    const productId = req.query.productId;
    const warehouseId = req.query.warehouseId;
    Inventory.find({$and: [{productId: productId}, {warehouseId: warehouseId}]})
    .populate('sectionId')
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};
exports.getInventoryQty = (req, res) => {
    const productId = req.query.productId;
    const warehouseId = req.query.warehouseId;
    const sectionId = req.query.sectionId;
    Inventory.findOne({$and: [{warehouseId: warehouseId}, {productId: productId}, {sectionId: sectionId}]})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).json(err);
    });
},
exports.postTransfer = (req, res) => {
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
    Transfer.findOne({createdAt: {$gte: today}}).sort({createdAt: '-1'})
    .then(result => {
        if(result) {
            const no = result.no.substring(15)
            const newNo = parseInt(no) + 1
            newID = `${dd}${mm}/DPI/TR/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/TR/${yy}/1`
        }
        const transfer = new Transfer({
            no: newID,
            fromWarehouseId: req.body.fromWarehouseId,
            toWarehouseId: req.body.toWarehouseId,
            remarks: req.body.remarks,
            status: 'New',
            items: req.body.transfers,
            userId: req.user._id
        })
        return transfer.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putTransfer = (req, res) => {
    const transferId = req.params.transferId
    Transfer.findById(transferId)
    .then(transfer => {
        transfer.remarks = req.body.remarks
        transfer.items = req.body.items
        return transfer.save();
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.putTransferInventory = async(req, res) => {
    const transferId = req.params.transferId;
    const transfer = await Transfer.findById(transferId);
    const fromWarehouseId = transfer.fromWarehouseId;
    const toWarehouseId = transfer.toWarehouseId;
    const items = transfer.items;
    for await (let item of items) {
        const inventory = await Inventory.findOne({ $and: [{warehouseId: fromWarehouseId}, {productId: item.productId}, {sectionId: item.fromSectionId}]}).populate('productId', 'name sku');
        if(inventory.qty < item.qty) {
            return res.status(400).send(inventory)
        }
    }
    for await(let item of items) {
        const inventory = await Inventory.findOne({ $and: [{warehouseId: fromWarehouseId}, {productId: item.productId}, {sectionId: item.fromSectionId}]});
        const update = await Inventory.findOne({$and: [{warehouseId: toWarehouseId}, {productId: item.productId}, {sectionId: item.toSectionId}]});
        if(update) {
            const reduceQty = inventory.qty - item.qty;
            const sumQty = update.qty + item.qty;
            inventory.qty = reduceQty;
            update.qty = sumQty;
            await inventory.save()
            await update.save()
        } else {
            const reduceQty = inventory.qty - item.qty;
            inventory.qty = reduceQty;
            const newInventory = new Inventory({
                warehouseId: toWarehouseId,
                sectionId: item.toSectionId,
                productId: item.productId,
                qty: item.qty,
                isDefault: false
            })
            await inventory.save()
            await newInventory.save()
        }
    }
    transfer.status = 'Completed'
    transfer.save()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};