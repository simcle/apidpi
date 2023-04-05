const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');

const Invoices = require('../models/invoice');
router.put('/', (req, res) => {
    let id = mongoose.Types.ObjectId('642d151f5d2380b5fa8b8212')
    console.log(id);
    Invoices.findById(id)
    .then( result => {
        result.amountDue = result.grandTotal
        result.save()
    })
})




module.exports = router;