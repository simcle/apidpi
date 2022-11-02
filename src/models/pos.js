const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PosSchema = new Schema({
    customerId: {type: Schema.Types.ObjectId},
    posNo: {type: String},
    shipping: {
        shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shippings'},
        shipmentService: {type: String},
        shipmentCost: {type: Number},
        bookingCode: {type: String},
        tasckingNumber: {type: String}
    },
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
            isSerialNumber: {type: Boolean},
            serialNumber: {type: Array},
            sellingPrice: {type: Number},
            unitPrice: {type: Number},
            stock: {type: Number},
            qty: {type: Number},
            total: {type: Number},
            discount: {
                discountType: {type: String},
                amount: {type: String},
                value: {type: Number},
            },
            subTotal: {type: Number},
        }
    ],
    discount: {
        discountType: {type: String},
        amount: {type: String},
        value: {type: Number}
    },
    tax: {
        code: {type: String},
        amount: {type: Number},
        value: {type: Number}
    },
    total: {type: Number},
    grandTotal: {type: Number},
    paymentMethod: {type: String},
    bankId: {type: Schema.Types.ObjectId},
    userId: {type: Schema.Types.ObjectId}
}, {
    timestamps: true
});

module.exports = mongoose.model('Pointofsales', PosSchema)