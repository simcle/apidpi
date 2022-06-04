const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventorySchema = new Schema({
    warehouseId: {type: Schema.Types.ObjectId, ref: 'Warehouse'},
    productId: {type: Schema.Types.ObjectId, ref: 'Product'},
    sectionId: {type: Schema.Types.ObjectId, ref: 'Section'},
    isDefault: {type: Boolean, default: false},
    qty: {type: Number} 
}, {
    timestamps: true
});

module.exports = mongoose.model('Inventory', InventorySchema);