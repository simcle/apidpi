const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SalesSchmea = new Schema({
    no: {type: String},
    quotationId: {type: Schema.Types.ObjectId, ref: 'Quotation'},
    customerId: {type: Schema.Types.ObjectId, ref: 'Customer', required: true},
    address: {type: Object},
    customerPO: {type: String},
    remarks: {type: String},
    tags: {type: Array},
    estimatedDeliveryDate: {type: Date},
    dateValidaty: {type: Date},
    creditTermId: {type: Schema.Types.ObjectId, ref: 'CreditTerm'},
    shipmentTermId: {type: Schema.Types.ObjectId, ref: 'ShipmentTerm'},
    shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shipping'},
    shipmentService: {type: String},
    shipmentCost: {type: Number},
    shipmentStatus: {type: String},
    paymentStatus: {type: String},
    additionalCharges: {type: Array},
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
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
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

module.exports = mongoose.model('Sales', SalesSchmea);