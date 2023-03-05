const Tasks = require('../models/tasks');
const Suppliers = require('../models/suppliers');
const Customers = require('../models/customers');
const Sales = require('../models/sales');

exports.getDashboard = (req, res) => {
    const customers = Customers.aggregate([
        {$group: {
            _id: '$customerGroup',
            count: {$sum:1}
        }}
    ])
    const suppliers = Suppliers.count()
    Promise.all([
        customers,
        suppliers
    ])
    .then(result => {
        res.status(200).json({
            customers: result[0]
        })
    })
}