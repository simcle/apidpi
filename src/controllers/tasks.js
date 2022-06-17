const Task = require('../models/tasks');


exports.getTask = (req, res) => {
    const documentId = req.params.documentId;
    Task.find({documentId: documentId}).populate('userId', 'name').sort({createdAt: '-1'})
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
        status: 'In Progress',
        dueDate: req.body.dueDate,
        userId: req.user._id
    })
    task.save()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err)
    })
};

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