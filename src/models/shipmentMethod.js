const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShipmentMethodSchema = new Schema({
    code: {type: String},
    description: {type: String}
},{
    timestamps: true
});

module.exports = mongoose.model('ShipmentMethod', ShipmentMethodSchema);