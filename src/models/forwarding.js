const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ForwardingSchema = new Schema({
    name: {type: String},
    company: {type: String},
    address: {type: String},
    city: {type: String},
    state: {type: String},
    country: {type: String},
    zip: {type: String},
    phone: {type: String},
    fax: {type: String},
    email: {type: String},
    shippingMark: {type: String}
}, {
    timestamps: true
})

module.exports = mongoose.model('Forwarding', ForwardingSchema);