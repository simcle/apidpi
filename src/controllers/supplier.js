const Currencies = require('../models/currencies');
const PaymentTerms = require('../models/paymentTerm');
const ShipmentTerms = require('../models/shipmentTerm');
const ShipmentMethods = require('../models/shipmentMethod');
const Taxs = require('../models/taxCode');
const Purchases = require('../models/purchases');
const Suppliers = require('../models/suppliers');
const Tasks = require('../models/tasks');

exports.getSuppliers  = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20
    const search = req.query.search;
    let totalItems;
    Suppliers.find({$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {code: {$regex: '.*'+search+'.*', $options: 'i'}}]}) 
    .countDocuments()
    .then(count => {
        totalItems = count
        return Suppliers.find({$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {code: {$regex: '.*'+search+'.*', $options: 'i'}}]})
        .skip((currentPage -1) * perPage)
        .limit(perPage)
        .sort({createdAt: 'desc'})
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

exports.createSupplier = (req, res) => {
    const currencies = Currencies.find();
    const paymentTerms = PaymentTerms.find();
    const shipmentTerms = ShipmentTerms.find();
    const shipmentMethods = ShipmentMethods.find();
    const taxs = Taxs.find();

    Promise.all([
        currencies,
        paymentTerms,
        shipmentTerms,
        shipmentMethods,
        taxs
    ])
    .then(result => {
        res.status(200).json({
            currencies: result[0],
            paymentTerms: result[1],
            shipmentTerms: result[2],
            shipmentMethods: result[3],
            taxs: result[4]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postSupplier = (req, res) => {
    let code = req.body.code;
    if(!code) {
        code = ''
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charLengt = chars.length;
        for( let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * charLengt))
        }
    }
    const supplier = new Suppliers({
        name: req.body.name,
        code: code,
        website: req.body.website,
        internalRemarks: req.body.internalRemarks,
        externalRemarks: req.body.externalRemarks,
        tags: req.body.tags,
        defaultCurrencyId: req.body.defaultCurrencyId,
        defaultPaymentTermId: req.body.defaultPaymentTermId,
        defaultShipmentTermId: req.body.defaultShipmentTermId,
        defaultShipmentMethodId: req.body.defaultShipmentMethodId,
        defaultTaxId: req.body.defaultTaxId,
        addressLists: req.body.addressLists,
        contactLists: req.body.contactLists
    })
    supplier.save()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.detailSupplier = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 10
    let totalItems;
    const supplierId = req.params.supplierId;
    
    const tasks = Tasks.find({documentId: supplierId})
    const purchases = Purchases.find({supplierId: supplierId})
    .countDocuments()
    .then(count => {
        totalItems = count
        return Purchases.find({supplierId: supplierId})
        .skip((currentPage -1) * perPage)
        .limit(perPage)
        .sort({createdAt: -1})
    })
    const supplier = Suppliers.findById(supplierId)
    .populate('defaultCurrencyId', 'code')
    .populate('defaultPaymentTermId', 'code')
    .populate('defaultShipmentTermId', 'code')
    .populate('defaultShipmentMethodId', 'code')
    .populate('defaultTaxId')

    Promise.all([
        purchases,
        supplier,
        tasks
    ])
    .then(result => {
        const last_page = Math.ceil(totalItems / perPage)
        res.status(200).json({
            purchases: result[0],
            supplier: result[1],
            tasks: result[2],
            countPurchases: totalItems,
            pages: {
                current_page: currentPage,
                last_page: last_page
            }
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.editSupplier = (req, res) => {
    const currencies = Currencies.find();
    const paymentTerms = PaymentTerms.find();
    const shipmentTerms = ShipmentTerms.find();
    const shipmentMethods = ShipmentMethods.find();
    const taxs = Taxs.find();
    const supplier = Suppliers.findById(req.params.supplierId);
    Promise.all([
        currencies,
        paymentTerms,
        shipmentTerms,
        shipmentMethods,
        taxs,
        supplier
    ])
    .then(result => {
        res.status(200).json({
            currencies: result[0],
            paymentTerms: result[1],
            shipmentTerms: result[2],
            shipmentMethods: result[3],
            taxs: result[4],
            supplier: result[5]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.updateSupplier = (req, res) => {
    let code = req.body.code;
    if(!code) {
        code = ''
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charLengt = chars.length;
        for( let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * charLengt))
        }
    }
    Suppliers.findById(req.params.supplierId)
    .then(supplier => {
        supplier.name = req.body.name,
        supplier.code = code,
        supplier.website = req.body.website,
        supplier.internalRemarks = req.body.internalRemarks,
        supplier.externalRemarks = req.body.externalRemarks,
        supplier.tags = req.body.tags,
        supplier.defaultCurrencyId = req.body.defaultCurrencyId,
        supplier.defaultPaymentTermId = req.body.defaultPaymentTermId,
        supplier.defaultShipmentTermId = req.body.defaultShipmentTermId,
        supplier.defaultShipmentMethodId = req.body.defaultShipmentMethodId,
        supplier.defaultTaxId = req.body.defaultTaxId,
        supplier.addressLists = req.body.addressLists,
        supplier.contactLists = req.body.contactLists
        return supplier.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putSupplierAddress = (req, res) => {
    const supplierId = req.params.supplierId;
    Suppliers.findById(supplierId)
    .then(supplier => {
        supplier.addressLists = req.body.addressLists;
        return supplier.save();
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putSupplierContact = (req, res) => {
    const supplierId = req.params.supplierId;
    Suppliers.findById(supplierId)
    .then(supplier => {
        supplier.contactLists = req.body.contactLists;
        return supplier.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};