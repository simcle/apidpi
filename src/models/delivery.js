const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeliverySchema = new Schema({
    deliveryNo: {type: String},
    suratJalanNo: {type: String},
    salesId: {type: Schema.Types.ObjectId, ref: 'Sales'},
    customerId: {type: Schema.Types.ObjectId, ref: 'Customer'},
    customerPO: {type: String},
    warehouseId: {type: Schema.Types.ObjectId, ref: 'Warehouse'},
    shipTo: {type: Schema.Types.ObjectId},
    scheduled: {type: Date},
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
            isSerialNumber: {type: Boolean},
            serialNumber: {type: Array},
            qty: {type: Number},
            reserved: {type: Number, default: null},
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
    valiDate: {type: Date},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

module.exports = mongoose.model('Delivery', DeliverySchema);
