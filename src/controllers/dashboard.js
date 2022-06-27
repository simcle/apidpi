const Tasks = require('../models/tasks');
const Suppliers = require('../models/suppliers');
const Customers = require('../models/customers');

exports.getDashboard = (req, res) => {
    const tasks = Tasks.find({status: 'In Progress', type: 'Task'})
    const suppliers = Suppliers.aggregate([
        {$unwind: {
            path: '$addressLists',
            preserveNullAndEmptyArrays: true
        }},
        {$group: {
            _id: '$addressLists.country' , count: {$sum: 1}
        }},
        {$group: {
            _id: '$_id', total: {$sum: 1}
        }}
    ])
    const customers = Customers.aggregate([
        {$group: {
            _id: '$customerGroupId', count: {$sum: 1},
        }},
        {$lookup: {
            from: 'customergroups',
            localField: '_id',
            foreignField: '_id',
            as: 'customerGroup'
        }},
        {$unwind: {
            path: '$customerGroup',
            preserveNullAndEmptyArrays: true
        }},
        {$sort: {count: -1}},
        {$project: {
            _id: 1,
            count: 1,
            group: '$customerGroup.name'
        }},
    ])
    Promise.all([
        tasks,
        suppliers,
        customers
    ])
    .then(result => {
        res.status(200).json({
            tasks: result[0],
            suppliers: result[1],
            customers: result[2]
        })
    })
}