const SerialNumbers = require('../models/serialNumbers');



exports.getSerialNumber = (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = req.query.perPage || 20;
    const search = req.query.search;
    const filter = req.query.filters;
    let totalItems;
    let sn;
    if(search) {
        sn = {serialNumber: search}
    } else {
        sn = {}
    }
    let query;
    if(filter) {
        query = {status: {$in: filter}}
    } else {
        query = {}
    }
    SerialNumbers.aggregate([
        {$match: {$and: [sn, query]}},
        {$count: 'count'}
    ])
    .then(count => {
        if(count.length > 0) {
            totalItems = count[0].count
        } else {
            totalItems = 0
        }
        return SerialNumbers.aggregate([
            {$match: {$and: [sn, query]}},
            {$lookup: {
                from: 'products',
                foreignField: '_id',
                localField: 'productId',
                pipeline: [
                    {$project: {
                        _id: 0,
                        name: 1,
                        sku: 1,
                    }}
                ],
                as: 'product'
            }},
            {$unwind: '$product'},
            {$project: {
                sku: '$product.sku',
                serialNumber: 1,
                product: '$product.name',
                status: 1,
                createdAt: 1
                
            }},
            {$sort: {salesCreated: -1}},
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
        res.status(400).send(err);
    })
}