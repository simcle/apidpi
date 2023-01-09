const mongoose = require('mongoose');
const Invoices = require('../models/invoice');
const Sales = require('../models/sales')
const Payments = require('../models/payment');

exports.getInvoive = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search;
    const filter = req.query.filter;
    const salesId = req.query.salesId
    let totalItems;
    let query;
    let sales;
    if(filter) {
        query = {status: {$in: filter}}
    } else {
        query = {}
    }
    if(salesId) {
        sales = {salesId: mongoose.Types.ObjectId(salesId)}
    } else {
        sales = {}
    }
    Invoices.aggregate([
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
        {$match: {
            $and: [{$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {invoiceNo: {$regex: '.*'+search+'.*', $options:'i'}}]}, query, sales]
        }},
        {$count: 'count'}
    ])
    .then (count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }

        return Invoices.aggregate([
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
            {$match: {
                $and: [{$or: [{customer: {$regex: '.*'+search+'.*', $options: 'i'}}, {invoiceNo: {$regex: '.*'+search+'.*', $options:'i'}}]}, query, sales]
            }},
            {$sort: {createdAt: -1}},
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

exports.createInvoice = async (req, res) => {
    const grandTotal = req.body.grandTotal

    const items = req.body.items.map(obj => {
        obj.qty = obj.qty - obj.invoiced
        return obj
    }).filter(obj => obj.qty > 0)
    const downPayments = req.body.downPayments.filter(obj => obj.status == 'Nothing')

    let invoice;
    if(req.body.type == 'Regular') {
        invoice = new Invoices({
            invoiceNo: 'Draft Invoice',
            salesId: req.body._id,
            customerId: req.body.customerId,
            billTo: req.body.billTo,
            shipTo: req.body.shipTo,
            dueDate: new Date(),
            confirmDate: new Date(),
            paymentStatus: 'Not Paid',
            paymentTermId: req.body.paymentTerm._id,
            status: 'Draft',
            type: req.body.type,
            items: items,
            downPayments: downPayments,
            total: req.body.total,
            additionalCharges: req.body.additionalCharges,
            totalAdditionalCharges: req.body.totalAdditionalCharges,
            discount: req.body.discount,
            tax: req.body.tax,
            shipping: req.body.shipping,
            grandTotal: grandTotal,
            amountDue: grandTotal,
            offerConditions: req.body.offerConditions,
            userID: req.user._id
        })
    } else {
        invoice = new Invoices({
            invoiceNo: 'Draft Invoice',
            salesId: req.body._id,
            customerId: req.body.customerId,
            billTo: req.body.billTo,
            shipTo: req.body.shipTo,
            dueDate: new Date(),
            confirmDate: new Date(),
            paymentStatus: 'Not Paid',
            paymentTermId: req.body.paymentTerm._id,
            status: 'Draft',
            type: req.body.type,
            items: items,
            downPayments: downPayments,
            total: req.body.total,
            additionalCharges: req.body.additionalCharges,
            totalAdditionalCharges: req.body.totalAdditionalCharges,
            discount: req.body.discount,
            tax: req.body.tax,
            shipping: req.body.shipping,
            grandTotal: grandTotal,
            amountDue: req.body.downPayments[0].amount,
            offerConditions: req.body.offerConditions,
            userID: req.user._id
        })
    }
    invoice.save()
    .then(result => {
        Sales.findById(result.salesId)
        .then(sales => {
            if(result.type == 'Regular') {
                let dp = sales.downPayments.map(obj => {
                    obj.status = 'To Invoice'
                    return obj
                })
                let items = sales.items.map(obj => {
                    obj.invoiced = obj.qty
                    return obj
                })
                sales.invoiceStatus = 'Fully Invoiced'
                sales.items = items
                sales.downPayments = dp
            } else {
                sales.invoiceStatus = 'To Invoice'
                sales.downPayments.push(result.downPayments[0])
            }
            return sales.save()
        })
        .then(result => {
            res.status(200).json(result)
        })
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.getDetailInvoice = (req, res) => {
    const invoiceId = mongoose.Types.ObjectId(req.params.invoiceId);
    const invoice = Invoices.aggregate([
        {$match: {_id: invoiceId}},
        {$lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    name: 1
                }}
            ],
            as: 'user'
        }},
        {$unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'customers',
            localField: 'billTo',
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
                        customer: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: '$parents',
                                else: '$root'
                            }
                        },
                        displayName: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: {$concat: ['$parents.name', ', ', '$root.name']},
                                else: '$root.name'
                            }
                        },
                        attn: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: '$root.name',
                                else: ''
                            }
                        },
                    }
                },
            ],
            as: 'billTo'
        }},
        {$unwind: '$billTo'},
        {$lookup: {
            from: 'customers',
            localField: 'shipTo',
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
                {$graphLookup: {
                    from: 'customers',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'attn'
                }},
                {$unwind: {
                    path: '$attn',
                    preserveNullAndEmptyArrays: true
                }},
                {$sort: {'parents._id': 1}},
                {
                    $group: {
                        _id: "$_id",
                        parents: { $first: "$parents" },
                        attn: {$first: "$attn"},
                        root: { $first: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        customer: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: '$parents',
                                else: '$root'
                            }
                        },
                        displayName: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: {$concat: ['$parents.name', ', ', '$root.name']},
                                else: '$root.name'
                            }
                        },
                        attn: {
                            $cond: {
                                if: {$ifNull: ['$parents.name', false]},
                                then: '$root.name',
                                else: ''
                            }
                        },
                    }
                },
            ],
            as: 'shipTo'
        }},
        {$unwind: '$shipTo'},
        {$lookup: {
            from: 'sales',
            localField: 'salesId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    salesNo: 1,
                    customerPO: 1,
                    payments: 1
                }}
            ],
            as: 'sales'
        }},
        {$unwind: {
            path: '$sales',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'pointofsales',
            localField: 'salesId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    posNo: 1
                }}
            ],
            as: 'pos'
        }},
        {$unwind: {
            path: '$pos',
            preserveNullAndEmptyArrays: true
        }},
        {$addFields: {
            salesNo: {
                $cond: {
                    if: {$ifNull: ['$sales.salesNo', false]},
                    then: '$sales.salesNo',
                    else: '$pos.posNo'
                }
            },
            customerPO: '$sales.customerPO',
            payments: '$sales.payments'
        }},
        {$lookup: {
            from: 'paymentterms',
            localField: 'paymentTermId',
            foreignField: '_id',
            as: 'paymentTerm'
        }},
        {$unwind: {
            path: '$paymentTerm',
            preserveNullAndEmptyArrays: true
        }},
        {$lookup: {
            from: 'banks',
            localField: 'bankId',
            foreignField: '_id',
            as: 'bank'
        }},
        {$unwind: {
            path: '$bank',
            preserveNullAndEmptyArrays: true
        }},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                    stock: 1
                }},
            ],
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$addFields: {
            'items.name': '$items.product.name',
            'items.stock': '$items.product.stock'
        }},
        {$unset: 'items.product'},
        {$group: {
            _id: '$_id',
            items: {$push: '$items'},
            root: {$first: '$$ROOT'}
        }},
        {$project: {
            'root.items' : 0,
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
    const payments = Payments.aggregate([
        {$match: {invoiceId: invoiceId}},
        {$lookup: {
            from: 'banks',
            localField: 'bankId',
            foreignField: '_id',
            as: 'bank'
        }},
        {$unwind: {
            path: '$bank',
            preserveNullAndEmptyArrays: true
        }}
    ])
    Promise.all([
        invoice,
        payments
    ])
    .then(result => {
        res.status(200).json({
            invoice: result[0][0],
            payments: result[1]
        })
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    })
}

exports.confirmInvoice = (req, res) => {
    const date = new Date();
    let dd = date.getDate();
    let mm = date.getMonth() +1;
    let yy = date.getFullYear().toString().substring(2);
    dd = checkTime(dd);
    mm = checkTime(mm)

    function checkTime (i) {
        if(i < 10) {
            i = `0${i}`
        }
        return i
    }

    let today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const invoiceId = req.params.invoiceId
    Invoices.findById(invoiceId)
    .then(async(invoice )=> {
        let invoiceNo = await Invoices.findOne({$and: [{status: 'Posted'},  {confirmDate: {$gte: today}}]}).sort({confirmDate: -1})
        let newID
        if(invoiceNo) {
            const no = invoiceNo.invoiceNo.substring(16)
            const newNo = parseInt(no)+1
            newID = `${dd}${mm}/DPI/INV/${yy}/${newNo}`
        } else {
            newID = `${dd}${mm}/DPI/INV/${yy}/1`
        }
        invoice.confirmDate = new Date()
        invoice.invoiceNo = newID
        invoice.status = 'Posted'
        return invoice.save()
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.updateInvoice = async (req, res) => {
    const invoiceId = req.params.invoiceId
    Invoices.findById(invoiceId)
    .then(inv => {
        inv.bankId = req.body.bankId
        inv.items = req.body.items
        inv.total = req.body.total
        inv.grandTotal = req.body.grandTotal
        return inv.save()
    })
    .then (() => {
        res.status(200).json('OK')
    })
}

exports.cancelledInvoice = async (req, res) => {
    const invoiceId = req.params.invoiceId
    const salesId = req.query.salesId
    const downPaymentId = req.query.downPaymentId
    const items = req.body.items
    let invoice;
    await Invoices.findById(invoiceId)
    .then(result => {
        invoice = result
        result.status = 'Cancelled'
       return result.save()
    })
    .then(async () => {
        const invoices = await Invoices.find({$and: [{salesId: salesId}, {status: {$ne: 'Cancelled'}}]})
        Sales.findById(salesId)
        .then(sale => {
            let dp = sale.downPayments.findIndex(obj => obj._id == downPaymentId)
            for (let i=0; i < items.length; i++) {
                for(let s=0; s < sale.items.length; s++) {
                    if(items[i].idx == sale.items[s].idx) {
                        if(items[i].qty > 0 && invoice.type == 'Regular') {
                            sale.items[s].invoiced = sale.items[s].invoiced - items[i].qty
                        }
                    }
                }
            }
            if(invoices.length == 0) {
                sale.invoiceStatus = 'Nothing to Invoice'
            } else {
                sale.invoiceStatus = 'To Invoice'
            }
            if(invoice.type != 'Regular') {
                sale.downPayments.splice(dp, 1)
            }
            return sale.save()
        })
        .then(result => {
            res.status(200).json(result)
        })
    })
}
