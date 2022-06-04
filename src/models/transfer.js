const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransferSchema = new Schema({
    no: {type: String},
    fromWarehouseId: {type: Schema.Types.ObjectId, ref: 'Warehouse'},
    toWarehouseId: {type: Schema.Types.ObjectId, ref: 'Warehouse'},
    remarks: {type: String},
    status: {type: String},
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
            fromSectionId: {type: Schema.Types.ObjectId, ref: 'Section'},
            toSectionId: {type: Schema.Types.ObjectId, ref: 'Section'},
            qty: {type: Number}
        }
    ],
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

module.exports = mongoose.model('Transfer', TransferSchema)