const Tasks = require('../models/tasks');

exports.getDashboard = (req, res) => {
    const tasks = Tasks.find({status: 'In Progress', type: 'Task'})

    Promise.all([
        tasks
    ])
    .then(result => {
        res.status(200).json({
            tasks: result[0]
        })
    })
}