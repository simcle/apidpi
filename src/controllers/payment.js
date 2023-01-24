const mongoose = require('mongoose');
const Payments = require('../models/payment');
const Invoices = require('../models/invoice');
const Sales = require('../models/sales');

exports.createPayment = (req, res) => {
    let bankId;
    let pay;
    if(req.body.bankId) {
        bankId = req.body.bankId
    } else {
        bankId
    }
    const payment = new Payments({
        journal: req.body.journal,
        invoiceId: req.body.invoiceId,
        customerId: req.body.customerId,
        paymentDate: req.body.paymentDate,
        amount: req.body.amount,
        bankId: bankId,
        userId: req.user._id
    })
    payment.save()
    .then(result => {
        pay = result
        Invoices.findById(result.invoiceId)
        .then(invoice => {
            if(result.amount < invoice.amountDue) {
                invoice.paymentStatus = 'Partial'
            } else {
                if(result.journal == 'Cash' || result.journal == 'Debit') {
                    invoice.paymentStatus = 'Paid'
                } else {
                    invoice.paymentStatus = 'In Payment'
                }
            }
            invoice.amountDue -= req.body.amount
            return invoice.save()
        })
        .then(result => {
            Sales.findById(result.salesId)
            .then(sales => {
                sales.payments.push(pay)
                return sales.save()
            })
            .then(result => {
                res.status(200).json(result)
            })
        })
        .catch(err => {
            res.status(400).send(err)
        })
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

// exports.reconciliate = (req, res) => {
//     Payments.aggregate([
//         {$lookup: {
//             from: 'invoices',
//             localField: 'invoiceId',
//             foreignField: '_id',
//             as: 'invoice'
//         }},
//         {$unwind: '$invoice'},
//         {$lookup: {
//             from: 'banks',
//             localField: 'bankId',
//             foreignField: '_id',
//             as: 'bank'
//         }},
//         {$unwind: '$bank'},
//         {$lookup: {
//             from: 'customers',
//             localField: 'customerId',
//             foreignField: '_id',
//             pipeline: [
//                 {$graphLookup: {
//                     from: 'customers',
//                     startWith: '$parentId',
//                     connectFromField: 'parentId',
//                     connectToField: '_id',
//                     as: 'parents'
//                 }},
//                 {$unwind: {
//                     path: '$parents',
//                     preserveNullAndEmptyArrays: true
//                 }},
//                 {$sort: {'parents._id': 1}},
//                 {
//                     $group: {
//                         _id: "$_id",
//                         parents: { $first: "$parents" },
//                         root: { $first: "$$ROOT" }
//                     }
//                 },
//                 {
//                     $project: {
//                         customer: {
//                             $cond: {
//                                 if: {$ifNull: ['$parents.name', false]},
//                                 then: '$parents',
//                                 else: '$root'
//                             }
//                         },
//                         displayName: {
//                             $cond: {
//                                 if: {$ifNull: ['$parents.name', false]},
//                                 then: {$concat: ['$parents.name', ', ', '$root.name']},
//                                 else: '$root.name'
//                             }
//                         },
//                         attn: {
//                             $cond: {
//                                 if: {$ifNull: ['$parents.name', false]},
//                                 then: '$root.name',
//                                 else: ''
//                             }
//                         },
//                     }
//                 },
//             ],
//             as: 'customer'
//         }},
//         {$unwind: '$customer'},
//         {$addFields: {
//             paymentStatus: '$invoice.paymentStatus',
//             invoiceNo: '$invoice.invoiceNo',
//             customer: '$customer.displayName',
//             isSelected: false
//         }},
//         {$match: {
//             paymentStatus: 'In Payment'
//         }},
//         {$group: {
//             _id: '$invoiceId',
//             root: {$push: '$$ROOT'}
//         }},
       
//     ])
//     .then((result) => {
//         return res.status(200).json(result)
//     })
// }