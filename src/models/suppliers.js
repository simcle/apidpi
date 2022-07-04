const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SupplierSchema = new Schema({
    name: {type: String},
    code: {type: String},
    website: {type: String},
    internalRemarks: {type: String},
    externalRemarks: {type: String},
    tags: {type: Array},
    defaultCurrencyId: {type: Schema.Types.ObjectId, ref: 'Currency'},
    defaultPaymentTermId: {type: Schema.Types.ObjectId, ref: 'PaymentTerm'},
    defaultShipmentTermId: {type: Schema.Types.ObjectId, ref: 'ShipmentTerm'},
    defaultShipmentMethodId: {type: Schema.Types.ObjectId, ref: 'ShipmentMethod'},
    defaultTaxId: {type: Schema.Types.ObjectId, ref: 'TaxCode'},
    addressLists: {type: Array},
    contactLists: {type: Array}
},{
    timestamps: true
})

module.exports = mongoose.model('Supplier', SupplierSchema);