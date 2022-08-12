const mongoose = require('mongoose');
const Customers = require('../models/customers');
const CreditTerms = require('../models/creditTerm');
const ShipmentTerms = require('../models/shipmentTerm');
const ShipmentMethods = require('../models/shipping');
const AdditionalCharges = require('../models/additionalCharge');
const TaxCode = require('../models/taxCode');
const Produts = require('../models/products');
const Sales = require('../models/sales');
const Activity = require('../models/activity');
const Task = require('../models/tasks');
const activity = require('../modules/activityHistory');

exports.getSales = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search
    let totalItems;
    Sales.find()
    .countDocuments()
    .then(count => {
        totalItems = count;
        return Sales.find()
        .populate('customerId', 'name')
        .skip((currentPage -1) * perPage)
        .limit(perPage)
        .sort({createdAt: 'desc'});
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
}

exports.getDetailSales = (req, res) => {
    const salesId = req.params.salesId;
    const sales = Sales.findById(salesId)
    .populate('quotationId', 'customerPO')
    .populate('customerId', 'name code')
    .populate('creditTermId', 'code')
    .populate('shipmentMethodId', 'name')
    .populate('shipmentTermId', 'code')
    .populate('items.productId', 'name');
    const activity = Activity.find({documentId: salesId})
    .populate('userId', 'name')
    .populate('updated.items.productId','name')
    .sort({createdAt: '-1'});
    const tasks = Task.find({documentId: salesId})
    .populate('assignee', 'name')
    .populate('userId', 'name')
    .sort({createdAt: '-1'});
    Promise.all([
        sales,
        activity,
        tasks
    ])
    .then(result => {
        res.status(200).json({
            sales: result[0],
            activity: result[1],
            tasks: result[2]
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.createSalse = (req, res) => {
    const creditTerms =  CreditTerms.find().select('_id code').sort({code: '1'}).lean()
    const shipmentTerms =  ShipmentTerms.find().select('_id code').sort({code: '1'}).lean()
    const shipmentMethods =  ShipmentMethods.find({status: true}).sort({name: '1'}).lean()
    const additionalCharges =  AdditionalCharges.find({status: true}).sort({name: '1'}).lean()
    const taxCodes =  TaxCode.find().sort({code: '1'}).lean()

    Promise.all([
        creditTerms,
        shipmentTerms,
        shipmentMethods,
        additionalCharges,
        taxCodes
    ])
    .then(result => {
        res.status(200).json({
            creditTerms: result[0].map(obj => {
                obj.id = obj._id, 
                obj.text = obj.code 
                return obj
            }),
            shipmentTerms: result[1].map(obj => {
                obj.id = obj._id,
                obj.text = obj.code
                return obj
            }),
            shipmentMethods: result[2].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            additionalCharges: result[3].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            taxCodes: result[4].map(obj => {
                obj.id = obj.code,
                obj.text = `${obj.code} (${obj.amount}%)`
                return obj
            })
        });
    })
};

exports.editSales = (req, res) => {
    const salesId = req.params.salesId;
    const creditTerms =  CreditTerms.find().select('_id code').sort({code: '1'}).lean()
    const shipmentTerms =  ShipmentTerms.find().select('_id code').sort({code: '1'}).lean()
    const shipmentMethods =  ShipmentMethods.find({status: true}).sort({name: '1'}).lean()
    const additionalCharges =  AdditionalCharges.find({status: true}).sort({name: '1'}).lean()
    const taxCodes =  TaxCode.find().sort({code: '1'}).lean()
    const sales = Sales.findById(salesId).populate('items.productId','name')

    Promise.all([
        creditTerms,
        shipmentTerms,
        shipmentMethods,
        additionalCharges,
        taxCodes,
        sales
    ])
    .then(async (result) => {
        const customerId = result[5].customerId;
        const customer = await Customers.findById(customerId)
        res.status(200).json({
            creditTerms: result[0].map(obj => {
                obj.id = obj._id, 
                obj.text = obj.code 
                return obj
            }),
            shipmentTerms: result[1].map(obj => {
                obj.id = obj._id,
                obj.text = obj.code
                return obj
            }),
            shipmentMethods: result[2].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            additionalCharges: result[3].map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            }),
            taxCodes: result[4].map(obj => {
                obj.id = obj.code,
                obj.text = `${obj.code} (${obj.amount}%)`
                return obj
            }),
            sales: result[5],
            customer: customer
        });
    })
    .catch(err => {
        console.log(err);
    })
}

exports.getCustomers = (req, res) => {
    const search = req.query.search;
    Customers.find({$or: [{name: {$regex:'.*'+ search, $options: 'i'}}, {code: search}]})
    .then(result => {
        res.status(200).json(result);
    })
};

exports.getProduct = async (req, res) => {
    const search = req.query.search;
    const params = req.query.notin
    let ids = [];
    for await (let pr of params) {
        if(pr) {
            ids.push(mongoose.Types.ObjectId(pr))
        }
    }
    Produts.find({$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}], _id: {$nin: ids}})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postSales = (req, res) => {
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
            newID = `${dd}${mm}/DPI/INV/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/INV/${yy}/1`
        }
        const sales = new Sales({
            no: newID,
            customerId: req.body.customerId,
            address: req.body.address,
            customerPO: req.body.customerPO,
            remarks: req.body.remarks,
            tags: req.body.tags,
            estimatedDeliveryDate: req.body.estimatedDeliveryDate,
            dateValidaty: req.body.dateValidaty,
            creditTermId: req.body.creditTermId,
            shipmentTermId: req.body.shipmentTermId,
            shipmentCost: req.body.shipmentCost,
            shipmentMethodId: req.body.shipmentMethodId,
            shipmentService: req.body.shipmentService,
            shipmentStatus: 'In Progress',
            paymentStatus: 'In Progress',
            additionalCharges: req.body.additionalCharges,
            items: req.body.items,
            totalQty: req.body.totalQty,
            total: req.body.total,
            totalAdditionalCharges: req.body.totalAdditionalCharges,
            discount: req.body.discount,
            tax: req.body.tax,
            grandTotal: req.body.grandTotal,
            status: 'Open',
            userId: req.user._id
        })
        return sales.save()
    })
    .then(result => {
        activity('insert','Sales Order', result.customerId, result._id, result.no, req.user._id, result, result)
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    });
};

exports.putSales = async (req, res) => {
    const salesId = req.params.salesId;
    const original = await Sales.findById(salesId).lean()
    Sales.findById(salesId)
    .then(sales => {
        sales.customerId= req.body.customerId,
        sales.address= req.body.address,
        sales.customerPO= req.body.customerPO,
        sales.remarks= req.body.remarks,
        sales.tags= req.body.tags,
        sales.estimatedDeliveryDate= req.body.estimatedDeliveryDate,
        sales.dateValidaty= req.body.dateValidaty,
        sales.creditTermId= req.body.creditTermId,
        sales.shipmentCost = req.body.shipmentCost,
        sales.shipmentTermId= req.body.shipmentTermId,
        sales.shipmentMethodId= req.body.shipmentMethodId,
        sales.shipmentService= req.body.shipmentService,
        sales.additionalCharges= req.body.additionalCharges,
        sales.items= req.body.items,
        sales.totalQty= req.body.totalQty,
        sales.total= req.body.total,
        sales.totalAdditionalCharges= req.body.totalAdditionalCharges,
        sales.discount= req.body.discount,
        sales.tax= req.body.tax,
        sales.grandTotal= req.body.grandTotal
        return sales.save()
    })
    .then(result => {
        activity('update','Sales Order', result.customerId, result._id, result.no, req.user._id, original, result)
        res.status(200).json(result)
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    })
}