const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema ({
    type: {type: String},
    documentId: {type: Schema.Types.ObjectId},
    documentName: {type: String},
    route: {type: String},
    description: {type: String},
    dueDate: {type: Date},
    assignee: {type: Schema.Types.ObjectId, ref: 'User'},
    status: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    edited: {type: Boolean, default: false}
}, {
    timestamps: true
})

module.exports = mongoose.model('Task', TaskSchema);