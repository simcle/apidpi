const Activity = require('../models/activity');

exports.getActivity = (req, res) => {
    Activity.find()
    .populate('userId', 'name')
    .limit(20)
    .sort({createdAt: '-1'})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}