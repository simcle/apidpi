const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentTermSchema = new Schema({
    code: {type: String},
    description: {type: String},
    days: {type: Number, default: null}
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentTerm', PaymentTermSchema);