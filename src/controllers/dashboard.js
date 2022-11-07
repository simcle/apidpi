const Tasks = require('../models/tasks');
const Suppliers = require('../models/suppliers');
const Customers = require('../models/customers');
const Sales = require('../models/sales');

exports.getDashboard = (req, res) => {
    res.status(200).json('OK')
}