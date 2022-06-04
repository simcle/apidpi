const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SupplierSchema = new Schema({
    name: {type: String},
    code: {type: String},
    website: {type: String},
    internalRemarks: {type: String},
    externalRemarks: {type: String},
    tags: {type: Array},
    defaultCurrencyId: {type: Schema.Types.ObjectId},
    defaultPaymentTermId: {type: Schema.Types.ObjectId},
    defaultShipmentTermId: {type: Schema.Types.ObjectId},
    defaultShipmentMethodId: {type: Schema.Types.ObjectId},
    defaultTaxId: {type: Schema.Types.ObjectId},
    addressLists: {type: Array},
    contactLists: {type: Array}
},{
    timestamps: true
})

module.exports = mongoose.model('Supplier', SupplierSchema);