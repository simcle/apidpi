const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseSchema = new Schema({
    no: {type: String},
    confirmDate: {type: Date},
    supplierId: {type: Schema.Types.ObjectId, ref: 'Supplier', required: true},
    address: {type: Object},
    referenceNumber: {type: String},
    remarks: {type: String},
    tags: {type: Array},
    estimatedReceiveDate: {type: Date},
    dateValidaty: {type: Date},
    paymentTermId: {type: Schema.Types.ObjectId, ref: 'PaymentTerm'},
    currencyId: {type: Schema.Types.ObjectId, ref: 'Currency'},
    exchangeRate: {type: Number},
    shipmentTermId: {type: Schema.Types.ObjectId},
    shipmentMethodId: {type: Schema.Types.ObjectId},
    additionalCharges: {type: Array},
    shipping: {
        shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shippings'},
        shipmentService: {type: String},
        shipmentCost: {type: Number},
        bookingCode: {type: String},
        trackingNumber: {type: String}
    },
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
            isSerialNumber: {type: Boolean},
            serialNumber: {type: Array},
            unitPrice: {type: Number},
            stock: {type: Number},
            qty: {type: Number},
            received: {type: Number, default: 0},
            billed: {type: Number, default: 0},
            total: {type: Number},
            discount: {
                discountType: {type: String},
                amount: {type: String},
                value: {type: Number},
            },
            subTotal: {type: Number},
            hover: {type: Boolean, default: false},
            edited: {type: Boolean, default: false},
            status: {type: Boolean, default: false},
        }
    ],
    total: {type: Number},
    totalAdditionalCharges: {type: Number},
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
    grandTotal: {type: Number},
    status: {type: String},
    receiveStatus: {type: String},
    billingStatus: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

module.exports = mongoose.model('Purchase', PurchaseSchema);