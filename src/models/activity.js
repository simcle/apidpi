const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    event: {type: String},
    action: {type: String},
    document: {type: String},
    parentId: {type: Schema.Types.ObjectId},
    documentId: {type: Schema.Types.ObjectId},
    documentName: {type: String},
    original: {type: Object},
    updated: {type: Object},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
})

module.exports = mongoose.model('Activity', ActivitySchema);