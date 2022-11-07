const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SerialNumberSchema = new Schema({
    productId: {type: Schema.Types.ObjectId},
    serialNumber: {type: String},
    documentIn: [
        {
            documentId: {type: Schema.Types.ObjectId}
        }
    ],
    documentOut: [
        {
            documentId: {type: Schema.Types.ObjectId}
        }
    ]
}, {
    timestamps: true
})

module.exports = mongoose.model('SerialNumber', SerialNumberSchema);