const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    sender: {type: Schema.Types.ObjectId, ref: 'User'},
    receiver: {type: Schema.Types.ObjectId, ref: 'User'},
    type: {type: String},
    content: {type: String},
    isRead: {type: Boolean, default: false},
}, {
    timestamps: true
})

module.exports = mongoose.model('Notification', NotificationSchema);