const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentTermSchema = new Schema({
    code: {type: String},
    duration: {type: Number, default: null},
    description: {type: String}
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentTerm', PaymentTermSchema);