const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema ({
    type: {type: String},
    documentId: {type: Schema.Types.ObjectId},
    doucment: {type: String},
    title: {type: String},
    details: {type: String},
    dueDate: {type: Date},
    status: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
})

module.exports = mongoose.model('Task', TaskSchema);