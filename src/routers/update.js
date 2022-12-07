const express = require('express')
const router = express.Router();

const Sales = require('../models/sales');
const Invoices = require('../models/invoice');

router.put('/', (req, res) => {
    Sales.find()
    .then( async(sales) => {
        for (let i = 0; i < sales.length; i++) {
            const el = sales[i];
            await Sales.findById(el._id)
            .then(async (sales) => {
                sales.billTo = sales.customerId
                sales.shipTo = sales.customerId
                await sales.save()
            })
        }
    })
    Invoices.find()
    .then(async(invoice) => {
        for (let i = 0; i < invoice.length; i++) {
            const el = invoice[i];
            await Invoices.findById(el._id)
            .then(async(inv) => {
                inv.billTo = inv.customerId
                inv.shipTo = inv.customerId
                await inv.save()
            })
        }
    })
})

module.exports = router;