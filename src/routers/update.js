const express = require('express')
const router = express.Router();


const Delivery = require('../models/delivery');
router.put('/', (req, res) => {
    Delivery.find({shipTo: {$exists: false}})
    .then(async (result) => {
        for(let i = 0; i < result.length; i++) {
            const el = result[i]
            console.log(el._id);
            await Delivery.findByIdAndUpdate(el._id, {shipTo: el.customerId})
        }
        res.status(200).json('done')
    })
})




module.exports = router;