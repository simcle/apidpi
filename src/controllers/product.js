const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');
const axios = require('axios');
const Brands = require('../models/brands');
const Categories = require('../models/categories');
const Currencies = require('../models/currencies');
const Warehouses = require('../models/warehouse');
const Products = require('../models/products');
const Inventory = require('../models/inventory');
const Purchases = require('../models/purchases');
const Sales = require('../models/sales');
const Pos = require('../models/pos');
const StockCard = require('../models/stockCard');
const StockOpname = require('../models/stockOpname');

exports.getProducts = (req, res) => {
    const brands = Brands.find().sort({name: 1});
    const categories = Categories.find().sort({name: 1});
    const allProducts = Products.find().count();
    const activeProducts = Products.find({status: true}).count();
    const deactiveProducts = Products.find({status: false}).count();
    const products = Products.find().populate('brandId', 'name').populate('categoriesId', 'name').limit(20).sort({createdAt: -1})
    Promise.all([
        brands,
        categories,
        allProducts,
        activeProducts,
        deactiveProducts,
        products
    ])
    .then(result => {
        const last_page = Math.ceil(result[2] / 20);
        res.status(200).json({
            brands: result[0],
            categories: result[1],
            allProducts: result[2],
            activeProducts: result[3],
            deactiveProducts: result[4],
            products: result[5],
            pages: {
                current_page: 1,
                last_page: last_page
            }
        });
    });
};

exports.getProductFilter = async (req, res) => {
    let totalItems;
    let categoriesId;
    const search = req.query.search || '';
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    let status
    let edited
    const brands = req.query.brands;
    const categories = req.query.categories;
    const sortKey = req.query.sortKey;
    const sortOrder = req.query.sortOrder;
    let brandIds
    let categoriesIds
    if(req.query.edited == 'true') {
        edited = {isEdited: req.query.edited}
    } else {
        edited = {}
    }
    if(req.query.status) {
        status = {status: {$in: req.query.status}}
    } else {
        status = {}
    }
    if(brands) {
        brandIds = {brandId: {$in: brands}}
    } else {
        brandIds = {}
    }
    if(categories) {
        categoriesIds = {categoriesId: {$in: categories}}
    } else {
        categoriesIds = {}
    }
    let sort = {}
    sort[sortKey] = parseInt(sortOrder)
    Products.find({$and: [{$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}]}, status, brandIds, categoriesIds, edited]})
    .countDocuments()
    .then(count => {
        totalItems = count
        return  Products.find({$and: [{$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}]}, status, brandIds, categoriesIds, edited]})
        .populate('brandId', 'name')
        .populate('categoriesId', 'name')
        .skip((currentPage -1) * perPage)
        .limit(perPage)
        .sort(sort)
    })
    .then(result => {
        const last_page = Math.ceil(totalItems / perPage)
        res.status(200).json({
            data: result,
            pages: {
                current_page: currentPage,
                last_page: last_page,
                totalItems: totalItems
            }
        })
    })
    .catch(err => {
        res.status(400).send(err)
    })
},

exports.getInventory = (req, res) =>  {
    const productId = mongoose.Types.ObjectId(req.params.productId);
    Inventory.aggregate([
        {$match: {productId: productId}},
        {$lookup: {
            from: 'warehouses',
            localField: 'warehouseId',
            foreignField: '_id',
            as: 'warehouse'
        }},
        {$unwind: '$warehouse'},
        {$lookup: {
            from: 'sections',
            localField: 'sectionId',
            foreignField: '_id',
            as: 'section'  
        }},
        {$unwind: '$section'},
        {$group: {
            _id: {warehouseId: '$warehouseId', name: '$warehouse.name'},
            sections: {$push: {name: '$section.name', qty: '$qty' }},
            total: {$sum: '$qty'}
        }}
    ])
    .then(result => {
        res.status(200).json(result)
    }) 
    .catch(err => {
        res.status(400).send(err)
    })

}

exports.getProductInfo = (req, res) => {
    const productId = req.params.productId;
    Products.findById(productId)
    .populate('brandId', 'name')
    .populate('categoriesId', 'name')
    .populate('accessories', 'images name sku')
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(200).send(err)
    })
}

exports.createProduct = (req, res) => {
    const brands = Brands.find();
    const categories = Categories.find();
    const currencies = Currencies.find({'status': true}).select('code symbolNative').sort({code: 'asc'});
    const warehouses = Warehouses.find({$and:[{isDefault: true},{status: true}]}).populate('sections').sort({name: 'asc'});
    Promise.all([
        brands,
        categories,
        currencies,
        warehouses
    ])
    .then(result => {
        res.status(200).json({
            brands: result[0],
            categories: result[1],
            currencies: result[2],
            warehouses: result[3]
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.editProduct = (req, res) => {
    const productId = req.params.productId;
    const brands = Brands.find();
    const categories = Categories.find();
    const currencies = Currencies.find({'status': true}).select('code symbolNative').sort({code: 'asc'});
    const product = Products.findById(productId).populate('accessories', '_id sku name images')
    const warehouses = Warehouses.find({$and:[{isDefault: true},{status: true}]}).populate('sections').sort({name: 'asc'})
    const inventory = Inventory.find({productId: productId, isDefault: true}) 
    Promise.all([
        brands,
        categories,
        currencies,
        product,
        warehouses,
        inventory
    ])
    .then(result => {
        res.status(200).json({
            brands: result[0],
            categories: result[1],
            currencies: result[2],
            product: result[3],
            warehouses: result[4],
            inventory: result[5]
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.getYoutube = (req, res) => {
    const id = req.body.id
    const apiKey = 'AIzaSyBQbc-iQW0WA_U1bM077v9IojkKng-sDcw';
    const baseURL = 'https://www.googleapis.com/youtube/v3/videos';
    const url = `${baseURL}?key=${apiKey}&part=snippet&id=${id}`
    axios.get(url)
    .then(response => {
        res.status(200).json(response.data.items[0])
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

// for edit product
exports.getWarehouse = (req, res) => {
    const productId = req.query.productId;
    const sectionId = req.query.sectionId;
    Inventory.findOne({productId: productId, sectionId: sectionId})
    .then(result => {
        if(result) {
            const qty = result.qty
            res.status(200).json(qty);
        } else {
            res.status(200).json(0);
        }
    })
    .catch(err => {
        res.status(400).send(err);
    });
};


exports.getProductAccessories = (req, res) => {
    const search = req.query.search;
    const params = req.query.notin || [];
    let ids = [];
    for (let param of params) {
        if(param) {
            ids.push(mongoose.Types.ObjectId(param))
        }
    }

    Products.find({name: {$regex: '.*'+search+'.*', $options: 'i'}, _id: {$nin: ids}})
    .then(result => {
        res.status(200).json(result);
    })
},

exports.postProduct = (req, res) => {
    const images = req.files.images;
    const imagesList = [];
    const attachments = req.files.files
    const attachmentLists = []
    Products.find({sku: req.body.sku})
    .then(async (result) => {
        if(result.length < 1) {
            if(images) {
                for await (const image of images) {
                    let filePath = `./public/img/products/700/${image.filename}`;
                    let filePathSmall = `./public/img/products/200/${image.filename}`;
                    await sharp(image.path)
                    .resize({height: 700})
                    .toFile(filePath);
                    await sharp(image.path)
                    .resize({height: 200})
                    .toFile(filePathSmall)
                    imagesList.push(image.filename)
                }
            }

            if(attachments) {
                for(const file of attachments) {
                    attachmentLists.push(file.path)
                }
            }

            const products = new Products({
                images: imagesList,
                attachments: attachmentLists,
                name: req.body.name,
                brandId: req.body.brandId,
                model: req.body.model,
                categoriesId: JSON.parse(req.body.categoriesId),
                condition: req.body.condition,
                description: req.body.description,
                videos: JSON.parse(req.body.videos),
                sku: req.body.sku,
                isSerialNumber: req.body.isSerialNumber,
                currency: req.body.currency,
                currencySymbol: req.body.currencySymbol,
                purchasePrice: req.body.purchasePrice,
                sellingPrice: req.body.sellingPrice,
                netPrice: req.body.netPrice,
                wholesale: JSON.parse(req.body.wholesale),
                measurements: JSON.parse(req.body.measurements),
                notes: JSON.parse(req.body.notes),
                accessories: JSON.parse(req.body.accessories),
                preorder: JSON.parse(req.body.preorder),
                stock: req.body.qtyStock,
                status: true,
                isEdited: false
            })
            products.save ()
            .then((result) => {
                const inventory = new Inventory({
                    warehouseId: req.body.warehouseId,
                    productId: result._id,
                    sectionId: req.body.sectionId,
                    isDefault: true,
                    qty: req.body.qtyStock
                })
                inventory.save()
                fs.readdir('public/img/temp', (err, files) => {
                    for(const file of files) {
                        fs.unlinkSync(`public/img/temp/${file}`)
                    }
                })
                res.status(200).json(result)
            })
            .catch(err => {
                res.status(400).send(err)
            })
        } else {
            if(images) {
                for(const image of images) {
                    fs.unlink(image.path, err => {
                        if(err) return
                    })
                }
            }
            res.status(400).send('SKU is already exists');
        }
    })
};

exports.putProduct = async (req, res) => {
    const images = req.files.images;
    const imagesList = [];
    const attachments = req.files.files
    const attachmentLists = []
    Inventory.findOne({$and:[{productId: req.params.productId}, {warehouseId: req.body.warehouseId}]})
    .then(inv => {
        if(!inv) {
            const inventory = new Inventory({
                warehouseId: req.body.warehouseId,
                sectionId: req.body.sectionId,
                productId: req.params.productId,
                isDefault: true,
                qty: 0
            })
            inventory.save()
        }
        else {
            inv.sectionId = req.body.sectionId
            inv.save()
        }
    })
    Products.findById(req.params.productId)
    .then(async (product) => {
        const oldImage = product.images
        for await (const img of oldImage) {
            if(fs.existsSync(`public/img/products/700/${img}`)) {
                fs.unlinkSync(`public/img/products/700/${img}`)
                fs.unlinkSync(`public/img/products/200/${img}`)
            }
        }
        if(images) {
            for await (const image of images) {
                let filePath = `./public/img/products/700/${image.filename}`;
                let filePathSmall = `./public/img/products/200/${image.filename}`;
                await sharp(image.path)
                .resize({height: 700})
                .toFile(filePath);
                await sharp(image.path)
                .resize({height: 200})
                .toFile(filePathSmall)
                imagesList.push(image.filename)
            }
        }
        if(attachments) {
            for(const file of attachments) {
                attachmentLists.push(file.path)
            }
        }
        console.log(req.body.model);
        product.images = imagesList
        product.attachments = attachmentLists
        product.name = req.body.name
        product.brandId = req.body.brandId
        product.model = req.body.model
        product.categoriesId = JSON.parse(req.body.categoriesId)
        product.condition = req.body.condition
        product.description = req.body.description
        product.videos = JSON.parse(req.body.videos)
        product.sku = req.body.sku
        product.isSerialNumber = req.body.isSerialNumber
        product.currency = req.body.currency
        product.currencySymbol = req.body.currencySymbol
        product.purchasePrice = req.body.purchasePrice
        product.sellingPrice = req.body.sellingPrice
        product.netPrice = req.body.netPrice
        product.wholesale = JSON.parse(req.body.wholesale)
        product.measurements = JSON.parse(req.body.measurements)
        product.notes = JSON.parse(req.body.notes)
        product.accessories = JSON.parse(req.body.accessories)
        product.preorder = JSON.parse(req.body.preorder)
        product.isEdited = false
        return product.save();
    })
    .then(result => {
        fs.readdir('public/img/temp', (err, files) => {
            for(const file of files) {
                fs.unlinkSync(`public/img/temp/${file}`)
            }
        })
        res.status(200).json(result);
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    });
};

exports.putSellingPrice = (req, res) => {
    Products.findById(req.params.productId)
    .then(product => {
        product.sellingPrice = req.body.sellingPrice
        return product.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putStatus = (req, res) => {
    Products.findById(req.params.productId)
    .then(product => {
        product.status = req.body.status
        return product.save()
    })
    .then(result => {
        res.status(200).json({status: result.status})
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

// for Quotations
exports.getStock = (req, res) => {
    const productId = req.params.productId;
    Products.findById(productId).select('stock images sku name isSerialNumber')
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

// for AtueSearch Component
exports.getProductAutoSearc = async (req, res) => {
    const search = req.query.search;
    const params = req.query.notin
    let ids = [];
    for await (let pr of params) {
        if(pr) {
            ids.push(mongoose.Types.ObjectId(pr))
        }
    }
    let query = {}
    if(!search) {
        query = {_id: {$nin: ids}}
    } else {
        query = {$and: [{status: true}, {$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}], _id: {$nin: ids}}]}
    }
    Products.find(query)
    .limit(7)
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

// for Modal Product Searc 
exports.productSearch = (req, res) => {
    const search = req.query.search
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    let totalItems;
    Products.find({$and: [{$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}]}, {status: true}]})
    .countDocuments()
    .then(count => {
        totalItems = count
        return Products.find({$and: [{$or: [{name: {$regex: '.*'+search+'.*', $options: 'i'}}, {sku: search}]}, {status: true}]})
        .skip((currentPage -1) * perPage)
        .limit(perPage)
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

exports.deleteProduct = (req, res) => {
    const productId = req.params.productId
    Products.findByIdAndDelete(productId)
    .then(() => {
        Inventory.deleteOne({productId: productId})
        .then(() => {
            res.status(200).json('OK')
        })
    })
}

// PRODUCT DETAIL
exports.overviewProduct = (req, res) => {
    const productId = mongoose.Types.ObjectId(req.params.productId)
    const product = Products.findById(productId).select('name stock createdAt updatedAt')
    const pos = Pos.aggregate([
        {$match: {items: {$elemMatch: {productId: productId}}}},
        {$project: {
            items: {
                $filter: {
                input: "$items",
                as: "item",
                cond: { $eq: [ "$$item.productId", productId ] }
                }
            }
        }},
        {$project: {
            productId: '$items.productId',
            qty: {$sum: '$items.qty'}
        }},
        {$group: {
            _id: 'POS',
            total: {$sum: '$qty'}
        }}
    ])

    const sales = Sales.aggregate([
        {$match: {$and: [{items: {$elemMatch: {productId: productId}}}, {invoiceStatus: 'Fully Invoiced'}]}},
        {$project: {
            items: {
                $filter: {
                input: "$items",
                as: "item",
                cond: { $eq: [ "$$item.productId", productId ] }
                }
            }
        }},
        {$project: {
            productId: '$items.productId',
            qty: {$sum: '$items.delivered'}
        }},
        {$group: {
            _id: 'Sales',
            total: {$sum: '$qty'}
        }}
    ])

    const purchases = Purchases.aggregate([
        {$match:{$and: [{items: {$elemMatch: {productId: productId}}}, {receiveStatus: 'Done'}]}},
        {$project: {
            items: {
                $filter: {
                input: "$items",
                as: "item",
                cond: { $eq: [ "$$item.productId", productId ] }
                }
            }
        }},
        {$project: {
            productId: '$items.productId',
            qty: {$sum: '$items.received'}
        }},
        {$group: {
            _id: 'pruchase',
            total: {$sum: '$qty'}
        }}
    ])
    Promise.all([
        product,
        pos,
        sales,
        purchases,
    ])
    .then(result => {
        res.status(200).json({
            product: result[0],
            pos: result[1][0],
            sales: result[2][0],
            purchases: result[3][0]
        })
    })
}

exports.productWarehouses = (req, res) => {
    Warehouses.find()
    .then(result => {
        res.status(200).json(result)
    })
}

exports.productInvenotries = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const productId = mongoose.Types.ObjectId(req.params.productId)
    const warehouseId = mongoose.Types.ObjectId(req.query.warehouseId)
    const inventory = Inventory.find({$and: [{productId: productId}, {warehouseId: warehouseId}]})
    const stockCount =  StockCard.aggregate([
        {$match: {$and: [{productId: productId}, {warehouseId: warehouseId}]}},
        {$sort: {createdAt: -1}},
        {$count: 'count'}
    ])
    const stockCard =  StockCard.aggregate([
        {$match: {$and: [{productId: productId}, {warehouseId: warehouseId}]}},
        {$sort: {createdAt: -1}},
        {$skip: (currentPage -1) * perPage},
        {$limit: perPage}
    ])
    Promise.all([
        inventory,
        stockCount,
        stockCard
    ])
    .then(async (result) => {
        let totalItems;
        if(result[1].length > 0) {
            totalItems = result[1][0].count
        } else {
            totalItems = 0
        }
        const last_page = Math.ceil(totalItems / perPage)
        const pageValue = currentPage * perPage - perPage + 1
        const pageLimit = pageValue + result[2].length -1

        let stockCard = result[2]
        for(let i=0; i < stockCard.length; i++) {
            let sc = stockCard[i]
            if(sc.documentName == 'Point Of Sales') {
                let doc = await Pos.findById(sc.documentId)
                stockCard[i].document = doc.posNo
            }
            if(sc.documentName == 'Sales Order') {
                let doc = await Sales.findById(sc.documentId)
                stockCard[i].document = doc.salesNo
            }
            if(sc.documentName == 'Purchase Order') {
                let doc = await Purchases.findById(sc.documentId)
                stockCard[i].document = doc.no
            }
            if(sc.documentName == 'Stock Opname') {
                let doc = await StockOpname.findById(sc.documentId)
                stockCard[i].document = doc.stockOpnameNo
            }
        }
        res.status(200).json({
            inventory: result[0][0],
            stockCards: stockCard,
            pages: {
                current_page: currentPage,
                last_page: last_page,
                pageValue: pageValue+'-'+pageLimit,
                totalItems: totalItems 
            },
        })
    })

}


