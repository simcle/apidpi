const mongoose = require('mongoose');
const CustomerGroup = require('../models/customerGroups');
const Provinces = require('../models/provinces');
const Users = require('../models/users');
const CreditTerms = require('../models/creditTerm');
const ShipmentTerms = require('../models/shipmentTerm');
const Shipings = require('../models/shipping');
const Taxs = require('../models/taxCode');
const Customer = require('../models/customers');
const Tasks = require('../models/tasks');

exports.getCustomers = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search;
    const filter = req.query.filter;
    let query = ''
    if(filter == 'total customer') {
        query= {$exists: true}
    } else if(filter == null) {
        query = {$in: null}
    } else {
        query = filter
    }
    let totalItems;
    const customerGroup = Customer.aggregate([
        {$group: {
            _id: '$customerGroupId', count: {$sum: 1},
        }},
        {$lookup: {
            from: 'customergroups',
            localField: '_id',
            foreignField: '_id',
            as: 'customerGroup'
        }},
        {$unwind: {
            path: '$customerGroup',
            preserveNullAndEmptyArrays: true
        }},
        {$sort: {count: -1}},
        {$project: {
            _id: 1,
            count: 1,
            group: '$customerGroup.name'
        }},
    ]) 
    const customer = Customer.find({name: {$regex: '.*'+search+'.*', $options: 'i'}, customerGroupId: query})
    .countDocuments()
    .then(count => {
        totalItems = count
        return Customer.find({name: {$regex: '.*'+search+'.*', $options: 'i'}, customerGroupId: query})
        .populate('customerGroupId', 'name')
        .populate('userId', 'name')
        .skip((currentPage -1) * perPage)
        .limit(perPage)
        .sort({createdAt: 'desc'})
        
    })
    
    Promise.all([
        customerGroup,
        customer
    ])
    .then(result => {
        const last_page = Math.ceil(totalItems / perPage)
        res.status(200).json({
            groups: result[0],
            data: result[1],
            pages: {
                current_page: currentPage,
                last_page: last_page
            }
        })
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.deatailCustomer = (req, res) => {
    const customerId = mongoose.Types.ObjectId(req.params.customerId);
    const tasks = Tasks.find({documentId: customerId})
    .populate('assignee', 'name')
    .populate('userId', 'name')
    .sort({createdAt: '-1'});

    const customer = Customer.aggregate([
        {$match: {_id: customerId}},
        {$lookup: {
            from: 'activities',
            localField: '_id',
            foreignField: 'parentId',
            pipeline: [
                {$lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                }},
                {$unwind: '$user'},
                {$project: {
                    document: 1,
                    documentName: 1,
                    documentId: 1,
                    event: 1,
                    createdAt: 1,
                    user: '$user.name'
                }}
            ],
            as: 'histories'
        }},
        {$lookup: {
            from: 'customergroups',
            localField: 'customerGroupId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    name: 1
                }}
            ],
            as: 'customerGroup'
        }},
        {$unwind: {
            path: '$customerGroup',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'creditterms',
            localField: 'defaultCreditTermId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    code: 1
                }}
            ],
            as: 'creditTerm'
        }},
        {$unwind: {
            path: '$creditTerm',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'shipmentterms',
            localField: 'defaultShipmentTermId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    code: 1
                }}
            ],
            as: 'shipmentTerm'
        }},
        {$unwind: {
            path: '$shipmentTerm',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'shippings',
            localField: 'defaultShipmentMethodId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    name:1
                }}
            ],
            as: 'shipmentMethod'
        }},
        {$unwind: {
            path: '$shipmentMethod',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'taxcodes',
            localField: 'defaultTaxId',
            foreignField: '_id',
            pipeline:[
                {$project: {
                    code: 1
                }}
            ],
            as: 'tax'
        }},
        {$unwind: {
            path: '$tax',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'quotations',
            localField: '_id',
            foreignField: 'customerId',
            pipeline:[
                {$group: {
                    _id: '$customerId', count: {$sum: 1}, total: {$sum: '$grandTotal'}
                }}
            ],
            as: 'quotation'
        }},
        {$unwind: {
            path: '$quotation',
            preserveNullAndEmptyArrays: true
        }}
    ])
    Promise.all([
        tasks,
        customer
    ])
    .then(result => {
        res.status(200).json({
            tasks: result[0],
            customer: result[1][0]
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.createCustomer = (req, res) => {
    const customerGroups = CustomerGroup.find();
    const provinces = Provinces.find();
    const users = Users.find().select('_id name');
    const creditTerms = CreditTerms.find();
    const shipmentTerms = ShipmentTerms.find();
    const shippings = Shipings.find();
    const taxs = Taxs.find();
    Promise.all([
        customerGroups,
        provinces,
        users,
        creditTerms,
        shipmentTerms,
        shippings,
        taxs
    ])
    .then(result => {
        res.status(200).json({
            customerGroups: result[0],
            provinces: result[1],
            users: result[2],
            creditTerms: result[3],
            shipmentTerms: result[4],
            shippings: result[5],
            taxs: result[6]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.editCustomer = (req, res) => {
    const customerGroups = CustomerGroup.find();
    const provinces = Provinces.find();
    const users = Users.find().select('_id name');
    const creditTerms = CreditTerms.find();
    const shipmentTerms = ShipmentTerms.find();
    const shippings = Shipings.find();
    const taxs = Taxs.find();
    const customer = Customer.findById(req.params.customerId)
    Promise.all([
        customerGroups,
        provinces,
        users,
        creditTerms,
        shipmentTerms,
        shippings,
        taxs,
        customer,
    ])
    .then(result => {
        res.status(200).json({
            customerGroups: result[0],
            provinces: result[1],
            users: result[2],
            creditTerms: result[3],
            shipmentTerms: result[4],
            shippings: result[5],
            taxs: result[6],
            customer: result[7]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.postCustomer = (req, res) => {
    let code = req.body.code;
    if(!code) {
        code = ''
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charLengt = chars.length;
        for( let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * charLengt))
        }
    }
    const customer = new Customer({
        name: req.body.name,
        code: code,
        customerGroupId: req.body.customerGroupId,
        priceListId: req.body.priceListId,
        website: req.body.website,
        taxRegistrationNumber: req.body.taxRegistrationNumber,
        remarks: req.body.remarks,
        tags: req.body.tags,
        access: req.body.access,
        userAccessLists: req.body.userAccessLists,
        defaultCreditTermId: req.body.defaultCreditTermId,
        defaultCreditLimit: req.body.defaultCreditLimit,
        defaultShipmentTermId: req.body.defaultShipmentTermId,
        defaultShipmentMethodId: req.body.defaultShipmentMethodId,
        defaultDiscountType: req.body.defaultDiscountType,
        defaultTaxId: req.body.defaultTaxId,
        addressLists: req.body.addressLists,
        contactLists: req.body.contactLists,
        userId: req.user._id
    });
    customer.save()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putCustomer = (req, res) => {
    let code = req.body.code;
    if(!code) {
        code = ''
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charLengt = chars.length;
        for( let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * charLengt))
        }
    }
    Customer.findById(req.params.customerId)
    .then(customer => {
        customer.name = req.body.name;
        customer.code = code;
        customer.customerGroupId = req.body.customerGroupId;
        customer.priceListId = req.body.priceListId;
        customer.website = req.body.website;
        customer.taxRegistrationNumber = req.body.taxRegistrationNumber;
        customer.remarks = req.body.remarks;
        customer.tags = req.body.tags;
        customer.access = req.body.access;
        customer.userAccessLists = req.body.userAccessLists;
        customer.defaultCreditTermId = req.body.defaultCreditTermId;
        customer.defaultCreditLimit = req.body.defaultCreditLimit;
        customer.defaultShipmentTermId = req.body.defaultShipmentTermId;
        customer.defaultShipmentMethodId = req.body.defaultShipmentMethodId;
        customer.defaultDiscountType = req.body.defaultDiscountType;
        customer.defaultTaxId = req.body.defaultTaxId;
        customer.addressLists = req.body.addressLists;
        customer.contactLists = req.body.contactLists;
        return customer.save ();
    })
    .then(result => {
        res.status(200).json({_id: result._id});
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postCustomerGruop = (req, res) => {
    const customer = new CustomerGroup({
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
        userId: req.body.userId
    })
    customer.save()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putCustomerGroup = (req, res) => {
    CustomerGroup.findById(req.params.customerGroupId)
    .then(customer => {
        customer.name = req.body.name
        customer.code = req.body.code
        customer.description = req.body.description
        return customer.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

exports.deleteCustomerGroup = (req, res) => {
    CustomerGroup.findByIdAndDelete(req.params.customerGroupId)
    .then(() => {
        res.status(200).send('OK');
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.putCustomerAddress = (req, res) => {
    const customerId = req.params.customerId;
    Customer.findById(customerId)
    .then(customer => {
        customer.addressLists = req.body.addressLists;
        return customer.save();
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putCustomerContact = (req, res) => {
    const customerId = req.params.customerId;
    Customer.findById(customerId)
    .then(customer => {
        customer.contactLists = req.body.contactLists;
        return customer.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).select(err);
    });
};