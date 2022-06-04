const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdjustmentSchema = new Schema({
    no: {type: String},
    warehouseId: {type: Schema.Types.ObjectId, ref: 'Warehouse'},
    remarks: {type: String},
    status: {type: String},
    items: [
        {   idx: {type: String},
            productId: {type: Schema.Types.ObjectId, ref: 'Product'}, 
            sectionId: {type: Schema.Types.ObjectId, ref: 'Section'}, 
            qty: {type: Number}
        }
    ],
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
},{
    timestamps: true
});

module.exports = mongoose.model('Adjustment', AdjustmentSchema);