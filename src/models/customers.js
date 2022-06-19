const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    name: {type: String, required: true},
    code: {type: String},
    customerGroupId: {type: Schema.Types.ObjectId, ref:'CustomerGroup', default: null},
    priceListId: {type: Schema.Types.ObjectId},
    website: {type: String},
    taxRegistrationNumber: {type: String},
    remarks: {type: String},
    tags: {type: Array},
    access: {type: String},
    userAccessLists: {type: Array},
    defaultCreditTermId: {type: Schema.Types.ObjectId},
    defaultCreditLimit: {type: Number},
    defaultShipmentTermId: {type: Schema.Types.ObjectId},
    defaultShipmentMethodId: {type: Schema.Types.ObjectId},
    defaultDiscountType: {type: String},
    defaultTaxId: {type: Schema.Types.ObjectId},
    addressLists: {type: Array},
    contactLists: {type: Array},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
},{
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);