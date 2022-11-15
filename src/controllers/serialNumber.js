const SerialNumbers = require('../models/serialNumbers');

exports.getSerialNumber = (req, res) => {
    const search = req.query.search
    SerialNumbers.aggregate([
        {$match: {serialNumber: search}},
        {$lookup: {
            from: 'products',
            foreignField: '_id',
            localField: 'productId',
            pipeline: [
                {$project: {
                    _id: 0,
                    name: 1,
                    images: 1
                }}
            ],
            as: 'product'
        }},
        {$unwind: '$product'}
    ])
    .then(result => {
        res.status(200).json(result[0])
    })
}