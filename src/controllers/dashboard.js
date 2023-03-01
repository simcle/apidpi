const Tasks = require('../models/tasks');
const Suppliers = require('../models/suppliers');
const Customers = require('../models/customers');
const Sales = require('../models/sales');

exports.getDashboard = (req, res) => {
    const customers = Customers.count()
    const suppliers = Suppliers.count()
    Promise.all([
        customers,
        suppliers
    ])
    .then(result => {
        res.status(200).json(result)
    })
}