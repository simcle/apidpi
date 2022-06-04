const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseSchema = new Schema({
    no: {type: String},
    supplierId: {type: Schema.Types.ObjectId, ref: 'Supplier', required: true},
    address: {type: Object},
    referenceNumber: {type: String},
    remarks: {type: String},
    tags: {type: Array},
    dateOrdered: {type: Date},
    estimatedReceiveDate: {type: Date},
    paymentTermId: {type: Schema.Types.ObjectId, ref: 'PaymentTerm'},
    shipmentTermId: {type: Schema.Types.ObjectId, ref: 'ShipmentTerm'},
    shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shipping'},
    currencyId: {type: Schema.Types.ObjectId, ref: 'Currency'},
    exchangeRate: {type: Number},
    additionalCharges: {type: Array},
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
            purchasePrice: {type: Number},
            unitPrice: {type: Number},
            qty: {type: Number},
            total: {type: Number},
            discount: {
                discountType: {type: String},
                amount: {type: String},
                value: {type: Number},
            },
            subTotal: {type: Number}
        }
    ],
    totalQty: {type: Number},
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
    paymentStatus: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

module.exports = mongoose.model('Purchase', PurchaseSchema);