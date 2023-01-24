const Invoices = require('../models/invoice')
const Payments = require('../models/payment')

exports.customerInvoice = (req, res) => {
    Invoices.aggregate([
        {$match: {paymentStatus: {$in: ['In Payment', 'Partial']}}},
        {$lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            pipeline: [
                {$project: {
                    name: 1
                }}
            ],
            as: 'user',
        }},
        {$unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
        }},
        {$addFields: {
            user: '$user.name',
        }},
        {$lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'invoiceId',
            pipeline: [
                {$lookup: {
                    from: 'banks',
                    localField: 'bankId',
                    foreignField: '_id',
                    as: 'bank'
                }},
                {$unwind: '$bank'},
                {$lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }},
                {$unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }},
                {$lookup: {
                    from: 'users',
                    localField: 'validateBy',
                    foreignField: '_id',
                    pipeline: [
                        {$project: {
                            name: 1
                        }}
                    ],
                    as: 'validBy',
                }},
                {$unwind: {
                    path: '$validBy',
                    preserveNullAndEmptyArrays: true
                }},
                {$addFields: {
                    user: '$user.name',
                    paid: '$amount',
                    validBy: '$validBy.name'
                }}
            ],
            as: 'payments'
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
                                then: '$parents.name',
                                else: '$root.name'
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
        {$project: {
            billTo: 1,
            payments: 1,
            invoiceNo: 1,
            grandTotal: 1,
            paymentStatus: 1,
            createdAt: 1,
            user: 1
        }},
        {$sort: {createdAt: -1}}
    ])
    .then(result => {
        res.status(200).send(result)
    })

}

exports.customerPost = (req, res) => {
    Payments.findById(req.body._id)
    .then(payment => {
        payment.isValidate = true
        payment.paid = req.body.paid
        payment.validated = new Date()
        payment.differece = req.body.amount - req.body.paid
        payment.validateBy = req.user._id
        return payment.save()
    })
    .then(() => {
        Invoices.findById(req.body.invoiceId)
        .then(invoice => {
            if(invoice.paymentStatus == 'In Payment') {
                invoice.paymentStatus = 'Paid'
            }
            return invoice.save()
        })
        .then(() => {
            return res.status(200).send('OK')
        })
    })
}