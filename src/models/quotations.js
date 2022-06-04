const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuotationSchmea = new Schema({
    no: {type: String},
    salesOrderId: {type: Schema.Types.ObjectId, ref: 'Sale'},
    customerId: {type: Schema.Types.ObjectId, ref: 'Customer', required: true},
    address: {type: Object},
    customerPO: {type: String},
    remarks: {type: Object},
    tags: {type: Array},
    estimatedDeliveryDate: {type: Date},
    dateValidaty: {type: Date},
    creditTermId: {type: Schema.Types.ObjectId, ref: 'CreditTerm'},
    shipmentTermId: {type: Schema.Types.ObjectId, ref: 'ShipmentTerm'},
    shipmentMethodId: {type: Schema.Types.ObjectId, ref: 'Shipping'},
    shipmentService: {type: String},
    additionalCharges: {type: Array},
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'},
            name: {type: String},
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
    offerConditions: {type: Object},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

module.exports = mongoose.model('Quotation', QuotationSchmea);