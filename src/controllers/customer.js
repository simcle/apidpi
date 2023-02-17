const mongoose = require('mongoose');
const Provinces = require('../models/provinces');
const Users = require('../models/users');
const CreditTerms = require('../models/creditTerm');
const ShipmentTerms = require('../models/shipmentTerm');
const Shipings = require('../models/shipping');
const Taxs = require('../models/taxCode');
const Customers = require('../models/customers');
const Tasks = require('../models/tasks');
const Invoices = require('../models/invoice')
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


exports.getCustomers = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search;
    let totalItems;
    const customers = Customers.aggregate([
        {$graphLookup: {
            from: 'customers',
            startWith: {$toObjectId: '$parentId'},
            connectFromField: 'parentId',
            connectToField: '_id',
            as: 'parents'  
        }},
        {$unwind: {
            path: '$parents',
            preserveNullAndEmptyArrays: true
        }},
        {
            $sort: {
                "parents._id": 1
            },
        },
        {
            $group: {
                _id: "$_id",
                parent: { $first: "$parents" },
                root: { $first: "$$ROOT" }
            }
        },
        {
            $project: {
                parent: '$parents.name',
                name: '$root.name',
                displayName: {
                    $cond: {
                        if: {$ifNull: ['$parent.name', false]},
                        then: {$concat: ['$parent.name', ', ', '$root.name']},
                        else: '$root.name'
                    }
                }
            }
        },
        {
            $sort: {
                "displayName": 1 
            }
        },
        {
            $match: {displayName: {$regex: '.*'+search+'.*', $options: 'i'}}
        },
        {
            $count: 'count'
        }
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return Customers.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'

                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {$graphLookup: {
                from: 'customers',
                startWith: {$toObjectId: '$parentId'},
                connectFromField: 'parentId',
                connectToField: '_id',
                as: 'parents'  
            }},
            {$unwind: {
                path: '$parents',
                preserveNullAndEmptyArrays: true
            }},
            {
                $sort: {
                    "parents._id": 1
                },
            },
            {
                $group: {
                    _id: "$_id",
                    parents: {$push: "$parents"},
                    parent: { $first: "$parents" },
                    user: {$first: "$user"},
                    root: { $first: "$$ROOT" }
                }
            },
            {
                $project: {
                    parents: '$parents',
                    group: '$root.customerGroup',
                    name: '$root.name',
                    address: '$root.address',
                    contact: '$root.contact',
                    displayName: {
                        $cond: {
                            if: {$ifNull: ['$parent.name', false]},
                            then: {$concat: ['$parent.name', ', ', '$root.name']},
                            else: '$root.name'
                        }
                    },
                    user: '$user.name',
                }
            },
            {
                $sort: {
                    "displayName": 1 
                }
            },
            {
                $match: {displayName: {$regex: '.*'+search+'.*', $options: 'i'}}
            },
            {
                $skip: (currentPage -1) * perPage
            }, 
            {
                $limit: perPage
            }
        ])
    })
    Promise.all([
        customers
    ])
    .then(result => {
        const last_page = Math.ceil(totalItems / perPage)
        const pageValue = currentPage * perPage - perPage + 1
        const pageLimit = pageValue + result[0].length -1
        res.status(200).json({
            data: result[0],
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

exports.deatailCustomer = (req, res) => {
    const customerId = mongoose.Types.ObjectId(req.params.customerId);
    const tasks = Tasks.find({documentId: customerId})
    .populate('assignee', 'name')
    .populate('userId', 'name')
    .sort({createdAt: '-1'});

    const customer = Customers.aggregate([
        {$match: {_id: customerId}},
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'

            }
        },
        {
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true
            }
        },
        {$graphLookup: {
            from: 'customers',
            startWith: {$toObjectId: '$_id'},
            connectFromField: '_id',
            connectToField: 'parentId',
            as: 'children',
            maxDepth: 0
        }},
        {$graphLookup: {
            from: 'customers',
            startWith: {$toObjectId: '$parentId'},
            connectFromField: 'parentId',
            connectToField: '_id',
            as: 'parents'  
        }},
        {$unwind: {
            path: '$parents',
            preserveNullAndEmptyArrays: true
        }},
        {
            $sort: {
                "parents._id": 1
            },
        },
        {
            $group: {
                _id: "$_id",
                parents: {$push: "$parents"},
                parent: { $first: "$parents" },
                user: {$first: "$user"},
                root: { $first: "$$ROOT" }
            }
        },
        {
            $project: {
                parents: 1,
                root: 1,
                displayName: {
                    $cond: {
                        if: {$ifNull: ['$parent.name', false]},
                        then: {$concat: ['$parent.name', ', ', '$root.name']},
                        else: '$root.name'
                    }
                },
                user: '$user.name',
            }
        },
    ])
    const Products = Invoices.aggregate([
        {$match: {customerId: customerId}},
        {$unwind: {
            path: '$items',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'item'
        }},
        {$unwind: {
            path: '$item',
            preserveNullAndEmptyArrays: true
        }},
        {$group: {
            _id: '$items.productId',
            sum: {$sum: '$items.qty'},
            name: {$first: '$item.name'}
        }}
        
    ])
    Promise.all([
        tasks,
        customer,
        Products
    ])
    .then(result => {
        res.status(200).json({
            tasks: result[0],
            customer: result[1][0],
            products: result[2]
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.editCustomer = (req, res) => {
    const customerId = mongoose.Types.ObjectId(req.params.customerId)
    Customers.aggregate([
        {
            $match: {_id: customerId}
        },
        {
            $graphLookup: {
                from: 'customers',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parentId',
                as: 'children',
                maxDepth: 0
            }
        },
        {
            $graphLookup: {
                from: 'customers',
                startWith: '$parentId',
                connectFromField: 'parentId',
                connectToField: '_id',
                as: 'parents',
            }
        },
        {
            $unwind: {
                path: '$parents',
                preserveNullAndEmptyArrays: true
            },
        },
        {
            $sort: {
                "parents._id": 1,
            },
        },
        {
            $group: {
                _id: "$_id",
                parents: { $push: "$parents" },
                root: { $first: "$$ROOT" }
            }
        },
        {
            $project: {
                "root.parents": 0
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        { parents: "$parents" },
                        "$root"
                    ]
                }
            }
        }
    ])
    .then(result => {
        res.status(200).json(result[0])
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

exports.postCustomer = async (req, res) => {
    let code = req.body.customerCode;
    let fileName = ''
    if(!code) {
        code = ''
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charLengt = chars.length;
        for( let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * charLengt))
        }
    }
    if(req.file) {
        if(req.file) {
            const {filename: image} = req.file
            const filePath = `./public/img/customer/${req.file.filename}`
            await sharp(req.file.path)
            .resize({height: 150})
            .toFile(filePath);
            fs.unlinkSync(req.file.path)
            fileName = `public/img/customer/${req.file.filename}`;
        } else {
            fileName = ''
        }
    }
    const customer = new Customers({
        name: req.body.name,
        image: fileName,
        customerGroup: req.body.customerGroup,
        customerCode: code,
        npwp: req.body.npwp,
        address: JSON.parse(req.body.address),
        contact: JSON.parse(req.body.contact),
        tags: JSON.parse(req.body.tags),
        remarks: req.body.remarks,
        userId: req.user._id
    });
    customer.save()
    .then(result => {
        let children = JSON.parse(req.body.children)
        if(children.length > 0) {
            (async () => {
                for (let i = 0; i < children.length; i++) {
                    const el = children[i];
                    await Customers.create({
                        name: el.name,
                        type: el.type,
                        customerGroup: result.customerGroup,
                        parentId: result._id,
                        address: el.address,
                        contact: el.contact,
                        remarks: el.remarks,
                        userId: req.user._id  
                    })
                }
            })()
        }
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putCustomer = async (req, res) => {
    let code = req.body.customerCode;
    let customerId = mongoose.Types.ObjectId(req.params.customerId)
    let fileName = ''
    if(!code) {
        code = ''
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charLengt = chars.length;
        for( let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * charLengt))
        }
    }
    if(req.file) {
        if(req.file) {
            const {filename: image} = req.file
            const filePath = `./public/img/customer/${req.file.filename}`
            await sharp(req.file.path)
            .resize({height: 150})
            .toFile(filePath);
            fs.unlinkSync(req.file.path)
            fileName = `public/img/customer/${req.file.filename}`;
        } else {
            fileName = ''
        }
    }
    Customers.findById({_id: customerId })
    .then(customer => {
        customer.name= req.body.name,
        customer.customerGroup= req.body.customerGroup,
        customer.customerCode= code,
        customer.npwp= req.body.npwp,
        customer.address= JSON.parse(req.body.address),
        customer.contact= JSON.parse(req.body.contact),
        customer.tags= JSON.parse(req.body.tags),
        customer.remarks= req.body.remarks,
        customer.userId= req.user._id
        if(fileName) {
            if(customer.image) {
                removeImage(customer.image)
            }
            customer.image = fileName
        }
        return customer.save()
    })
    .then(result => {
        let children = JSON.parse(req.body.children)
        if(children.length > 0) {
            (async () => {
                for (let i = 0; i < children.length; i++) {
                    const el = children[i];
                    if(el._id) {
                        let filter = {_id: el._id}
                        let update = {
                            name: el.name,
                            type: el.type,
                            customerGroup: result.customerGroup,
                            parentId: result._id,
                            address: el.address,
                            contact: el.contact,
                            remarks: el.remarks,
                        }
                        await Customers.findOneAndUpdate(filter, update)
                    } else {
                        await Customers.create({
                            name: el.name,
                            type: el.type,
                            customerGroup: result.customerGroup,
                            parentId: result._id,
                            address: el.address,
                            contact: el.contact,
                            remarks: el.remarks,
                            userId: req.user._id  
                        })
                    }
                }
            })()
        }
        return Customers.aggregate([
            {$match: {_id: customerId}},
            {
                $graphLookup: {
                    from: 'customers',
                    startWith: {$toObjectId: '$parentId'},
                    connectFromField: 'parentId',
                    connectToField: '_id',
                    as: 'parents',
                }
            },
            {
                $unwind: {
                    path: '$parents',
                    preserveNullAndEmptyArrays: true
                },
            },
            {
                $sort: {
                    "parents._id": 1,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    parents: { $push: "$parents" },
                    root: { $first: "$$ROOT" }
                }
            },
            {
                $project: {
                    "root.parents": 0
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { parents: "$parents" },
                            "$root"
                        ]
                    }
                }
            },
        ])
    })
    .then(result => {
        let customer = result.map(obj => {
            if(obj.parents.length > 0) {
                obj.displayName = obj.parents[0].name+', ' + obj.name 
            } else {
                obj.displayName = obj.name
            }
            obj.address = obj.address
            obj.contact = obj.contact

            return obj
        })
        res.status(200).json(customer[0])
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err);
    });
};

exports.getCustomersAutoSearch = (req, res) => {
    const search = req.query.search;
    let arr = search.split(',')
    let parent = arr[0]
    let query = {$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {'parents.name': {$regex: '.*'+parent+'.*', $options: 'i'}}]}
    if(arr.length > 1) {
        if(arr[1].length > 1) {
            query = {$and: [{'parents.name': parent}, {name: {$regex: '.*'+arr[1].trim()+'.*', $options: 'i'}}]}
        }
    }
    Customers.aggregate([
        {
            $graphLookup: {
                from: 'customers',
                startWith: {$toObjectId: '$parentId'},
                connectFromField: 'parentId',
                connectToField: '_id',
                as: 'parents',
            }
        },
        {
            $match: query
        },

        {
            $limit: 5
        },
        {
            $unwind: {
                path: '$parents',
                preserveNullAndEmptyArrays: true
            },
        },
        {
            $sort: {
                "parents._id": 1,
            },
        },
        {
            $group: {
                _id: "$_id",
                parents: { $push: "$parents" },
                root: { $first: "$$ROOT" }
            }
        },
        {
            $project: {
                "root.parents": 0
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        { parents: "$parents" },
                        "$root"
                    ]
                }
            }
        },
    ])
    .then(result => {
        let customer = result.map(obj => {
            if(obj.parents.length > 0) {
                obj.displayName = obj.parents[0].name+', ' + obj.name 
            } else {
                obj.displayName = obj.name
            }
            obj.address = obj.address
            obj.contact = obj.contact

            return obj
        })
        let customers = customer.sort(function (a, b) {
            let x = a.createdAt
            let y = b.createdAt
            if(x > y) {return 1}
            if(x < y) {return -1}
            return 0
        })
        res.status(200).json(customers)
    })
}

const removeImage = (filePath) => {
    filePath = path.join(__dirname, '../..', filePath);
    fs.unlink(filePath, err => {
       if(err) return;
    })
}