const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SerialNumberSchema = new Schema({
    productId: {type: Schema.Types.ObjectId},
    serialNumber: {type: String},
    status: {type: String},
    documentIn: [
        {
            documentNo: {type: String},
            documentName: {type: String},
            documentId: {type: Schema.Types.ObjectId}
        }
    ],
    documentOut: [
        {
            documentNo: {type: String},
            documentName: {type: String},
            documentId: {type: Schema.Types.ObjectId}
        }
    ]
}, {
    timestamps: true
})

module.exports = mongoose.model('SerialNumber', SerialNumberSchema);