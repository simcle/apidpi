const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaxCodeSchema = new Schema({
    code: {type: String},
    amount: {type: Number}
},{
    timestamps: true
});

module.exports = mongoose.model('TaxCode', TaxCodeSchema);