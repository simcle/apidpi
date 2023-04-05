const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');

const Invoices = require('../models/invoice');
router.put('/', (req, res) => {
    let id = mongoose.Types.ObjectId('642cf060cce6c4b1bc622cad')
    Invoices.findById(id)
    .then( result => {
        result.amountDue = result.grandTotal
        result.save()
    })
})




module.exports = router;