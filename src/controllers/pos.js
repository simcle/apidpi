const TaxCode = require('../models/taxCode');
const Banks = require('../models/banks');
const Pointofsales = require('../models/pos');
const Invoices = require('../models/invoice');
const Payments = require('../models/payment');
const Inventories = require('../models/inventory');
const updateStock = require('../modules/updateStock');
const stockCards = require('../modules/stockCard');
const SerialNumbers = require('../models/serialNumbers');

exports.getPos = (req, res) => {
    const search = req.query.search
    const filters = req.query.filters
    const currentPage = req.query.page || 1
    const perPage = req.query.perPage || 20
    let totalItems;
    let query;
    if(filters) {
        query = {paymentMethod: {$in: filters}}
    } else {
        query = {}
    } 
    Pointofsales.aggregate([
        {$lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            pipeline: [
                {$graphLookup: {
                    from: 'customers',
                    startWith: '$parentId',
                    connectFromField: 'parentId',
                    connectToField: '_id',
                    as: 'parents'
                }},
                {$unwind: {
                    path: '$parents',
                    preserveNullAndEmptyArrays: true
                }},
                {$sort: {'parents._id': 1}},
                {
                    $group: {
                        _id: "$_id",
                        parents: { $first: "$parents" },
                        root: { $first: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        parent: '$parents.name',
                        name: '$root.name',
                        address: '$root.address',
                        displayName: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: {$concat: ['$parents.name', ', ', '$root.name']},
                                else: '$root.name'
                            }
                        }
                    }
                },
            ],
            as: 'customer'
        }},
        {$unwind: '$customer'},
        {$addFields: {
            'customer': '$customer.displayName'
        }},
        {$match: {$and: [{$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {posNo: {$regex: '.*'+search+'.*', $options: 'i'}}]}, query]}},
        {$count: 'count'}
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return Pointofsales.aggregate([
            {$lookup: {
                from: 'customers',
                localField: 'customerId',
                foreignField: '_id',
                pipeline: [
                    {$graphLookup: {
                        from: 'customers',
                        startWith: '$parentId',
                        connectFromField: 'parentId',
                        connectToField: '_id',
                        as: 'parents'
                    }},
                    {$unwind: {
                        path: '$parents',
                        preserveNullAndEmptyArrays: true
                    }},
                    {$sort: {'parents._id': 1}},
                    {
                        $group: {
                            _id: "$_id",
                            parents: { $first: "$parents" },
                            root: { $first: "$$ROOT" }
                        }
                    },
                    {
                        $project: {
                            parent: '$parents.name',
                            name: '$root.name',
                            address: '$root.address',
                            displayName: {
                                $cond: {
                                    if: {$ifNull: ['$parents.name', false]},
                                    then: {$concat: ['$parents.name', ', ', '$root.name']},
                                    else: '$root.name'
                                }
                            }
                        }
                    },
                ],
                as: 'customer'
            }},
            {$unwind: '$customer'},
            {$lookup: {
                from: 'invoices',
                localField: '_id',
                foreignField: 'salesId',
                pipeline: [
                    {$project: {
                        _id: 1
                    }}
                ],
                as: 'invoiceId'
            }},
            {$unwind: {
                path: '$invoiceId',
                preserveNullAndEmptyArrays: true
            }},
            {$addFields: {
                'customer': '$customer.displayName'
            }},
            {$match: {$and: [{$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {posNo: {$regex: '.*'+search+'.*', $options: 'i'}}]}, query]}},
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
    .catch(err => {
        res.status(400).send(err)
    })
},

exports.createPos = (req, res) => {
    const TaxCodes = TaxCode.find().sort({code: 1})
    const BankLists = Banks.find().sort({name: 1})
    Promise.all([
        TaxCodes,
        BankLists
    ])
    .then(result => {
        res.status(200).json({
            taxCodes: result[0],
            banks: result[1]
        })
    })
}

exports.insertPos = async (req, res) => {
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

    let pos = await Pointofsales.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
    let invoice = await Invoices.findOne({$and: [{status: 'Posted'},  {confirmDate: {$gte: today}}]}).sort({confirmDate: -1})

    let posNo;
    if(pos) {
        const no = pos.posNo.substring(16)
        const newNo = parseInt(no) + 1
        posNo = `${dd}${mm}/DPI/POS/${yy}/${newNo}`
    } else {
        posNo = `${dd}${mm}/DPI/POS/${yy}/1`
    }

    let invoiceNo;
    if(invoice) {
        const no = invoice.invoiceNo.substring(16)
        const newNo = parseInt(no) + 1
        invoiceNo = `${dd}${mm}/DPI/INV/${yy}/${newNo}`
    } else {
        invoiceNo = `${dd}${mm}/DPI/INV/${yy}/1`
    }
    let documentId;
    let documentNo;
    let documentName;
    const pointOfSales = new Pointofsales({
        customerId: req.body.customerId,
        posNo: posNo,
        shipping: req.body.shipping.shipmentMethodId ? req.body.shipping:'',
        items: req.body.items,
        discount: req.body.discount,
        tax: req.body.tax,
        total: req.body.total,
        grandTotal: req.body.grandTotal,
        paymentMethod: req.body.paymentMethod,
        bankId: req.body.bankId,
        userId: req.user._id
    })
    pointOfSales.save()
    .then(result => {
        documentId = result._id
        documentNo = result.posNo
        documentName = 'Point Of Sales'
        const invoice = new Invoices({
            invoiceNo: invoiceNo,
            salesId: result._id,
            customerId: result.customerId,
            billTo: result.customerId,
            shipTo: result.customerId,
            dueDate: new Date(),
            confirmDate: new Date(),
            paymentStatus: 'Paid',
            status: 'Posted',
            type: 'Regular',
            items: result.items,
            total: result.total,
            discount: result.discount,
            tax: result.tax,
            totalAdditionalCharges: 0,
            shipping: req.body.shipping.shipmentMethodId ? req.body.shipping:'',
            grandTotal: result.grandTotal,
            amountDue: 0,
            userId: req.user._id
        })
        return invoice.save()
    })
    .then( async (result) => {
        if(req.body.paymentMethod == 'Multiple') {
            return Payments.insertMany([
                {
                    journal: 'Cash',
                    invoiceId: result._id,
                    customerId: result.customerId,
                    paymentDate: new Date(),
                    amount: req.body.multiplePayment.cash,
                    userId: req.user._id
                },
                {
                    journal: req.body.multiplePayment.journalBank,
                    invoiceId: result._id,
                    customerId: result.customerId,
                    paymentDate: new Date(),
                    amount: req.body.multiplePayment.bank,
                    bankId: req.body.multiplePayment.bankId,
                    userId: req.user._id
                }
            ])
            
        } else {
            const payment = new Payments({
                journal: req.body.paymentMethod,
                invoiceId: result._id,
                customerId: result.customerId,
                paymentDate: new Date(),
                amount: result.grandTotal,
                bankId: req.body.bankId,
                userId: req.user._id
            })
            return payment.save()
        }
    })
    .then(async (result) => {
        const items = req.body.items
        for (let i=0; i < items.length; i++ ) {
            let item = items[i]
            if(item.isSerialNumber) {
                for (let s=0; s < item.serialNumber.length; s++) {
                    let sn = item.serialNumber[s]
                    let serial = await SerialNumbers.findOne({$and: [{serialNumber: sn.sn}, {productId: item.productId}]})
                    if(serial) {
                        serial.status = 'Out Of Stock'
                        serial.documentOut.push({documentId: documentId, documentName: documentName, documentNo: documentNo})
                        await serial.save()
                    } else {
                        const newSerial = new SerialNumbers({
                            productId: item.productId,
                            serialNumber: sn.sn,
                            status: 'Out Of Stock',
                            documentOut: [{documentId: documentId, documentName: documentName, documentNo: documentNo}]
                        })
                        await newSerial.save()
                    }
                }
            }
            let inventory = await Inventories.findOne({$and: [{isDefault: true}, {productId: item.productId}]})
            if(inventory) {
                let qty = inventory.qty - item.qty
                inventory.qty = qty
                await inventory.save()
                await stockCards('out', inventory.warehouseId, item.productId, documentId, 'Point Of Sales', item.qty, qty)
                await updateStock(inventory.productId)
            }
        }
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err);
    })
}