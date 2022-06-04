const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CurrencySchema = new Schema({
    code: {type: String, unique: true},
    name: {type: String},
    status: {type: Boolean},
    symbolNative: {type: String}
}, {
    timestamps: true
});

module.exports = mongoose.model('Currency', CurrencySchema);
