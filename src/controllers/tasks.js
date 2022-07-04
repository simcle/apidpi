const Task = require('../models/tasks');
const Users = require('../models/users');

exports.createTask = (req, res) => {
    Users.find().select('name').lean()
    .then(result => {
        res.status(200).json({
            users: result.map(obj => {
                obj.id = obj._id,
                obj.text = obj.name
                return obj
            })
        })
    })   
}

exports.getTask = (req, res) => {
    const documentId = req.params.documentId;
    Task.find({documentId: documentId})
    .populate('assignee', 'name')
    .populate('userId', 'name')
    .sort({createdAt: '-1'})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.postTask = (req, res) => {
    const task = new Task({
        documentId: req.body.documentId,
        documentName: req.body.documentName,
        route: req.body.route,
        type: req.body.type,
        title: req.body.title,
        details: req.body.details,
        assignee: req.body.assignee,
        status: 'In Progress',
        dueDate: req.body.dueDate,
        userId: req.user._id
    })
    task.save()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        console.log(err);
        res.status(400).send(err)
    })
};

exports.editTask = (req, res) => {
    const taskId = req.params.taskId;
    Task.findById(taskId)
    .then(task => {
        task.type = req.body.type
        task.title = req.body.title,
        task.details = req.body.details,
        task.assignee = req.body.assignee,
        task.dueDate = req.body.dueDate

        return task.save()
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

exports.updateTask = (req, res) => {
    const taskId = req.params.taskId;
    Task.findById(taskId)
    .then(task => {
        task.status = req.body.status
        return task.save()
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