const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdditionalChargeSchema = new Schema({
    name: {type: String},
    unitPrice: {type: Number},
    isFixed: {type: Boolean},
    status: {type: Boolean, default: true},
    description: {type: String}
},{
    timestamps: true
});

module.exports = mongoose.model('AditionalCharge', AdditionalChargeSchema);