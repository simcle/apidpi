const Task = require('../models/tasks');
const Users = require('../models/users');

exports.getTask = (req, res) => {
    const documentId = req.params.documentId;
    const users = Users.find().select('_id name')
    const tasks = Task.find({documentId: documentId})
    .populate('assignee', 'name')
    .populate('userId', 'name')
    .sort({dueDate: 1})

    Promise.all([
        users,
        tasks
    ])
    .then(result => {
        res.status(200).json({
            users: result[0],
            tasks: result[1]
        });
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.postTask = async (req, res) => {
    await Task.updateMany({}, {$set: {edited: false}})
    const task = new Task({
        documentId: req.body.documentId,
        documentName: req.body.documentName,
        route: req.body.route,
        type: req.body.type,
        details: req.body.details,
        status: 'In Progress',
        dueDate: req.body.dueDate,
        userId: req.user._id
    })
    task.save()
    .then(result => {
        return Task.find({documentId: result.documentId})
        .populate('assignee', 'name')
        .populate('userId', 'name')
        .sort({dueDate: 1})
    })
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    })
};

exports.updateTask = async (req, res) => {
    const taskId = req.params.taskId;
    await Task.updateMany({}, {$set: {edited: false}})
    Task.findById(taskId)
    .then(task => {
        task.type = req.body.type
        task.description = req.body.description
        task.dueDate = req.body.dueDate
        task.status = req.body.status
        task.edited = req.body.edited
        if(req.body.assignee) {
            task.assignee = req.body.assignee
        }
        return task.save()
    })
    .then(result => {
        return Task.find({documentId: result.documentId})
        .populate('assignee', 'name')
        .populate('userId', 'name')
        .sort({dueDate: 1})
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.deleteTask = (req, res) => {
    const taskId = req.params.taskId
    Task.findByIdAndDelete(taskId)
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}