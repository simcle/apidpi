const Notification = require('../models/notification');

exports.getNotificationUread = (req, res) => {
    const type = req.query.type
    const userId = req.user._id
    Notification.find({$and: [{receiver: userId}, {type: type}, {isRead: false}]})
    .countDocuments()
    .then(count => {
        res.status(200).json(count);
    })
}

exports.deleteNotificationType = (req, res) => {
    const type = req.query.type;
    const userId = req.user._id
    Notification.deleteMany({$and: [{receiver: userId}, {type: type}]})
    .then(result => {
        res.status(200).json(result)
    })
}