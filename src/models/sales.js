const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SalesSchmea = new Schema({
    customerId: {type: Schema.Types.ObjectId, ref: 'Customer', required: true},
    shipTo: {type: Schema.Types.ObjectId, required: true},
    billTo: {type: Schema.Types.ObjectId, required: true},
    salesNo: {type: String},
    salesCreated: {type: Date},
    quotationNo: {type: String},
    customerReference: {type: String},
    customerPO: {type: String},
    remarks: {type: Object},
    tags: {type: Array},
    estimatedDeliveryTime: {type: String},
    dateValidaty: {type: Date},
    creditTermId: {type: Schema.Types.ObjectId, ref: 'CreditTerm'},
    paymentTermId: {type: Schema.Types.ObjectId, ref: 'PaymentTerm'},
    shipmentTermId: {type: Schema.Types.ObjectId, ref: 'ShipmentTerm'},
    shipping: {
        shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shippings'},
        shipmentService: {type: String},
        shipmentCost: {type: Number},
        bookingCode: {type: String},
        trackingNumber: {type: String}
    },
    shipmentStatus: {type: String},
    paymentStatus: {type: String},
    status: {type: String},
    additionalCharges: {type: Array},
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
        }
    ],
    downPayments: [
        {
            name: {type: String},
            date: {type: Date},
            amount: {type: Number},
            total: {type: Number},
            status: {type: String},
            paymentDate: {type: Date}
        }
    ],
    payments: [
        {
            journal: {type: String},
            invoiceId: {type: Schema.Types.ObjectId, ref: 'invoices'},
            customerId: {type: Schema.Types.ObjectId, ref: 'customers'},
            paymentDate: {type: Date},
            amount: {type: Number},
            bankId: {type: Schema.Types.ObjectId, ref: 'banks'},
            userId: {type: Schema.Types.ObjectId, ref: 'users'}
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
    offerConditions: {type: Object},
    invoiceStatus: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
}, {
    timestamps: true
});

module.exports = mongoose.model('Sales', SalesSchmea);