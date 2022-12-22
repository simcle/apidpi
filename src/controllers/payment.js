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