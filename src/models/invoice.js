const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
    invoiceNo: {type: String},
    salesId: {type: Schema.Types.ObjectId, ref: 'sales'},
    customerId: {type: Schema.Types.ObjectId, ref: 'customers'},
    billTo: {type: Schema.Types.ObjectId},
    shipTo: {type: Schema.Types.ObjectId},
    dueDate: {type: Date},
    confirmDate: {type: Date},
    paymentStatus: {type: String},
    paymentTermId: {type: Schema.Types.ObjectId},
    status: {type: String},
    type: {type: String},
    items: [{
        idx: {type: String},
        productId: {type: Schema.Types.ObjectId, ref: 'Product'},
        isSerialNumber: {type: Boolean},
        serialNumber: {type: Array},
        sellingPrice: {type: Number},
        unitPrice: {type: Number},
        stock: {type: Number},
        qty: {type: Number},
        delivered: {type: Number, default: 0},
        invoiced: {type: Number, default: 0},
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
    }],
    downPayments: [
        {
            name: {type: String},
            date: {type: Date},
            amount: {type: Number},
            total: {type: Number},
            status: {type: String, default: 'Nothing'},
        }
    ],
    bankId: {type: Schema.Types.ObjectId},
    total: {type: Number},
    additionalCharges: {type: Array},
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
    shipping: {
        shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shippings'},
        shipmentService: {type: String},
        shipmentCost: {type: Number},
        bookingCode: {type: String},
        tasckingNumber: {type: String}
    },
    grandTotal: {type: Number},
    amountDue: {type: Number},
    offerConditions: {type: Object},
    userId: {type: Schema.Types.ObjectId, ref: 'users'}
}, {
    timestamps: true
})

module.exports = mongoose.model('Invoice', InvoiceSchema);