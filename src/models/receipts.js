const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReceiptsSchema = new Schema({
    receiveNo: {type: String},
    purchaseId: {type: Schema.Types.ObjectId, ref: 'Purchase'},
    supplierId: {type: Schema.Types.ObjectId, ref: 'Supplier'},
    warehouseId: {type: Schema.Types.ObjectId, ref: 'Warehouse'},
    scheduled: {type: Date},
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
            isSerialNumber: {type: Boolean},
            serialNumber: {type: Array},
            qty: {type: Number},
            done: {type: Number, default: 0}
        }
    ],
    status: {type: String},
    shipping: {
        shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shippings'},
        shipmentService: {type: String, default: null},
        shipmentCost: {type: Number, default: 0},
        bookingCode: {type: String, default: null},
        trackingNumber: {type: String, default: null}
    },
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
})

module.exports = mongoose.model('Receipts', ReceiptsSchema);