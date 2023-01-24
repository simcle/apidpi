const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    journal: {type: String},
    invoiceId: {type: Schema.Types.ObjectId, ref: 'invoices'},
    customerId: {type: Schema.Types.ObjectId, ref: 'customers'},
    paymentDate: {type: Date},
    amount: {type: Number},
    bankId: {type: Schema.Types.ObjectId, ref: 'banks'},
    userId: {type: Schema.Types.ObjectId, ref: 'users'},
    isValidate: {type: Boolean, default: false},
    diffrence: {type: Number, default: 0},
    validated: {type: Date},
    validateBy: {type: Schema.Types.ObjectId}
}, {
    timestamps: true
})

module.exports = mongoose.model('Payment', PaymentSchema);