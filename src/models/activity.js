const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    event: {type: String},
    action: {type: String},
    document: {type: String},
    documentId: {type: Schema.Types.ObjectId},
    original: {type: Object},
    updated: {type: Object},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
})

module.exports = mongoose.model('Activity', ActivitySchema);