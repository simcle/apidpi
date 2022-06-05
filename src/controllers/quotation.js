const mongoose = require('mongoose');
const Customers = require('../models/customers');
const CreditTerms = require('../models/creditTerm');
const ShipmentTerms = require('../models/shipmentTerm');
const ShipmentMethods = require('../models/shipping');
const AdditionalCharges = require('../models/additionalCharge');
const TaxCode = require('../models/taxCode');
const Produts = require('../models/products');
const Quotations = require('../models/quotations');
const Activity = require('../models/activity');
const Task = require('../models/tasks');
const activity = require('../modules/activityHistory');
const { reset } = require('nodemon');

exports.getQuotations = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search
    let totalItems;
    Quotations.find()
    .countDocuments()
    .then(count => {
        totalItems = count;
        return Quotations.find()
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

exports.getDetailQotation = (req, res) => {
    const quotationId = req.params.quotationId;
    const quotation = Quotations.findById(quotationId)
    .populate('customerId', 'name code')
    .populate('creditTermId', 'code')
    .populate('shipmentMethodId', 'name')
    .populate('shipmentTermId', 'code')
    .populate('items.productId', 'name');
    const activity = Activity.find({documentId: quotationId})
    .populate('userId', 'name')
    .populate('updated.items.productId','name')
    .sort({createdAt: '-1'});
    const task = Task.find({documentId: quotationId})
    .populate('userId', 'name')
    .sort({createdAt: '-1'})

    Promise.all([
        quotation,
        activity,
        task
    ])
    .then(result => {
        res.status(200).json({
            quotation: result[0],
            activity: result[1],
            task: result[2]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.createQuotation = (req, res) => {
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

exports.editQuotation = (req, res) => {
    const quotationId = req.params.quotationId;
    const creditTerms =  CreditTerms.find().select('_id code').sort({code: '1'}).lean();
    const shipmentTerms =  ShipmentTerms.find().select('_id code').sort({code: '1'}).lean();
    const shipmentMethods =  ShipmentMethods.find({status: true}).sort({name: '1'}).lean();
    const additionalCharges =  AdditionalCharges.find({status: true}).sort({name: '1'}).lean();
    const taxCodes =  TaxCode.find().sort({code: '1'}).lean();
    const quotation = Quotations.findById(quotationId).populate('items.productId', 'name');
    Promise.all([
        creditTerms,
        shipmentTerms,
        shipmentMethods,
        additionalCharges,
        taxCodes,
        quotation
    ])
    .then(async (result) => {
        const customerId = result[5].customerId
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
            quotation: result[5],
            customer: customer
        });
    })

};

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
    Produts.find({$and: [{status: true}, {$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}], _id: {$nin: ids}}]})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
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
    
    Quotations.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
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
            customerId: req.body.customerId,
            address: req.body.address,
            customerPO: req.body.customerPO,
            remarks: req.body.remarks,
            tags: req.body.tags,
            estimatedDeliveryDate: req.body.estimatedDeliveryDate,
            dateValidaty: req.body.dateValidaty,
            creditTermId: req.body.creditTermId,
            shipmentTermId: req.body.shipmentTermId,
            shipmentMethodId: req.body.shipmentMethodId,
            shipmentService: req.body.shipmentService,
            additionalCharges: req.body.additionalCharges,
            items: req.body.items,
            totalQty: req.body.totalQty,
            total: req.body.total,
            totalAdditionalCharges: req.body.totalAdditionalCharges,
            discount: req.body.discount,
            tax: req.body.tax,
            status: 'New',
            grandTotal: req.body.grandTotal,
            offerConditions: req.body.offerConditions,
            userId: req.user._id
        })
        return quotation.save()
    })
    .then(result => {
        activity('insert','Quotation', result._id, result.no, req.user._id, result, result)
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

exports.putQuotation = async (req, res) => {
    const quotationId = req.params.quotationId;
    const original = await Quotations.findById(quotationId).lean()
    Quotations.findById(quotationId)
    .then(quotation => {
        quotation.customerId = req.body.customerId
        quotation.address = req.body.address;
        quotation.customerPO = req.body.customerPO;
        quotation.remarks = req.body.remarks;
        quotation.tags = req.body.tags;
        quotation.estimatedDeliveryDate = req.body.estimatedDeliveryDate;
        quotation.dateValidaty = req.body.dateValidaty;
        quotation.creditTermId = req.body.creditTermId;
        quotation.shipmentTermId = req.body.shipmentTermId;
        quotation.shipmentMethodId = req.body.shipmentMethodId;
        quotation.shipmentService = req.body.shipmentService;
        quotation.additionalCharges = req.body.additionalCharges;
        quotation.items = req.body.items;
        quotation.totalQty = req.body.totalQty;
        quotation.total = req.body.total;
        quotation.totalAdditionalCharges = req.body.totalAdditionalCharges;
        quotation.discount = req.body.discount;
        quotation.tax = req.body.tax;
        quotation.grandTotal = req.body.grandTotal;
        quotation.offerConditions = req.body.offerConditions
        return quotation.save()
    })
    .then(result => {
        activity('update','Quotation', result._id, result.no, req.user._id, original, result)
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}
