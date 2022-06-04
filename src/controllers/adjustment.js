const mongoose = require('mongoose');
const Product = require('../models/products');
const Warehouse = require('../models/warehouse');
const Adjustment = require('../models/adjustments');
const Inventory = require('../models/inventory');
const updateStock = require('../modules/updateStock');

exports.getAdjustments = async (req, res) => {
    const search = req.query.search;
    const warehouse = await Warehouse.find({name: {$regex: '.*'+search+'.*', $options: 'i'}}).select('_id')
    const warehouseId = warehouse.map(obj => obj._id.toString())
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    let totalItems;
    Adjustment.find({$or: [{no: {$regex: '.*'+search+'.*', $options: 'i'}},{warehouseId: {$in: warehouseId}}]})
    .countDocuments()
    .then(count => {
        totalItems = count
        return Adjustment.find({$or: [{no: {$regex: '.*'+search+'.*', $options: 'i'}},{warehouseId: {$in: warehouseId}}]})
        .populate('warehouseId', 'name')
        .populate('userId', 'name')
        .skip((currentPage -1) * perPage)
        .limit(perPage)
        .sort({createdAt: -1})
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
        res.status(400).send(err);
    });
},

exports.createAdjustment = (req, res) => {
    Warehouse.find({status: true})
    .populate('sections')
    .sort({name: 'asc'})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    })
}

exports.editAdjustment = (req, res) => {
    const adjustmentId = req.params.adjustmentId
    Adjustment.findById(adjustmentId).populate({
        path: 'warehouseId',
        populate: {
            path: 'sections'
        }
    })
    .populate('items.productId', 'name')
    .populate('items.sectionId', 'name')
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.getProducts = async (req , res) => {
    const search = req.query.search;
    const params = req.query.notin;
    let ids = [];
    for await (let pr of params) {
        if(pr) {
            ids.push(mongoose.Types.ObjectId(pr))
        }
    }
    Product.find({$or:[{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}], _id: {$nin: ids}})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    })
}

exports.postAdjustment = (req, res) => {
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
    
    Adjustment.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
    .then(result => {
        if(result) {
            const no = result.no.substring(15)
            const newNo = parseInt(no) + 1
            newID = `${dd}${mm}/DPI/AD/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/AD/${yy}/1`
        }
        const adjustment = new Adjustment({
            no: newID,
            warehouseId: req.body.warehouseId,
            remarks: req.body.remarks,
            status: 'New',
            items: req.body.adjustments,
            userId: req.user._id   
        })
        return adjustment.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
};

exports.getDetailAdjustment = (req, res) => {
    const adjustmentId = req.params.adjustmentId
    Adjustment.findById(adjustmentId)
    .populate('warehouseId', 'name')
    .populate('items.productId', 'name images sku')
    .populate('items.sectionId', 'name')
    .populate('userId', 'name')
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putAdjustment = (req, res) => {
    const adjustmentId = req.params.adjustmentId;
    Adjustment.findById(adjustmentId)
    .then(adjustment => {
        adjustment.remarks = req.body.remarks
        adjustment.items = req.body.adjustments
        return adjustment.save();
    })
    .then(() => {
        res.status(200).json('OK');
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.putAdjustmentInventory = async (req, res) => {
    const adjustmentId = req.params.adjustmentId;
    const adjustment = await Adjustment.findById(adjustmentId);
    const warehouseId = adjustment.warehouseId
    const items = adjustment.items
    for await(let item of items) {
        const inventory = await Inventory.findOne({$and: [{productId: item.productId}, {sectionId: item.sectionId}]})
        if(inventory) {
            const qty = inventory.qty + item.qty
            inventory.qty = qty;
            await inventory.save()
            await updateStock(item.productId)
        } else {
            const inv = new Inventory({
                warehouseId: warehouseId,
                sectionId: item.sectionId,
                productId: item.productId,
                isDefault: false,
                qty: item.qty
            })
            await inv.save()
            await updateStock(item.productId)
        }
    }
    adjustment.status = 'Completed'
    adjustment.save()
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

exports.deleteAdjustmetn = (req, res) => {
    const adjustmentId = req.params.adjustmentId;
    Adjustment.findByIdAndDelete(adjustmentId)
    .then(() => {
        res.status(200).json('OK');
    })
    .catch(err => {
        res.status(400).send(err);
    })
}

