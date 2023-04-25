const Tasks = require('../models/tasks');
const Suppliers = require('../models/suppliers');
const Customers = require('../models/customers');
const Sales = require('../models/sales');
const pointOfSales = require('../models/pos');
const Invoices = require('../models/invoice')
exports.getDashboard = (req, res) => {
    const customers = Customers.aggregate([
        {$group: {
            _id: '$customerGroup',
            count: {$sum:1}
        }}
    ])
    const suppliers = Suppliers.count()
    const start = new Date();
    start.setDate(start.getDate()-30)
    start.setHours(0,0,0,0)

    const sales = Sales.aggregate([
        {$match: {$and: [{status: 'Sales Order'}, {createdAt: {$gte: start}}]}},
        {$group: {
            _id: '$invoiceStatus',
            count: {$sum:1},
            total: {$sum: '$grandTotal'}
        }}
    ])
    const pos = pointOfSales.aggregate([
        {$match: {createdAt: {$gte: start}}},
        {$group: {
            _id: '$paymentMethod',
            count: {$sum:1},
            total: {$sum: '$grandTotal'}
        }}
    ])
    const invoices = Invoices.aggregate([
        {$match: {$and: [{status: 'Posted'}, {createdAt: {$gte: start}}]}},
        {$group: {
            _id: '$paymentStatus',
            count: {$sum:1},
            total: {$sum: '$grandTotal'}

        }}
    ])
    const products = Invoices.aggregate([
        {$match: {$and: [{status: 'Posted'}, {paymentStatus: {$in: ['In Payment', 'Paid']}}, {createdAt: {$gte: start}}]}},
        {$unwind: '$items'},
        {$lookup: {
            from: 'products',
            foreignField: '_id',
            localField: 'items.productId',
            as: 'items.product'
        }},
        {$unwind: '$items.product'},
        {$addFields: {
            'productId': '$items.productId',
            'name': '$items.product.name',
            'qty': '$items.qty'
        }},
        {$project: {
            'productId': 1,
            'name': 1,
            'qty': 1
        }},
        {$group: {
            _id: '$productId',
            qty: {$sum: '$qty'},
            name: {$first: '$name'}
        }},
        {$limit: 15},
        {$sort: {qty: -1}}
    ])
    Promise.all([
        customers,
        suppliers,
        sales,
        pos,
        invoices,
        products
    ])
    .then(result => {
        res.status(200).json({
            customers: result[0],
            suppliers: result[1],
            sales: result[2],
            pos: result[3],
            invoices: result[4],
            products: result[5]
        })
    })
}