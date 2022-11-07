const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StockOpnameSchema = new Schema({
    stockOpnameNo: {type: String},
    warehouseId: {type: Schema.Types.ObjectId},
    remarks: {type: String},
    items: [
        {
            idx: {type: String},
            productId: {type: Schema.Types.ObjectId},
            name: {type: String},
            isSerialNumber: {type: Boolean},
            stock: {type: Number},
            counted: {type: Number},
            difference: {type: Number},
            hover: {type: Boolean},
            edited: {type: Boolean}
        }
    ],
    status: {type: String, default: 'Draft'},
    validated: {type: Date},
    userId: {type: Schema.Types.ObjectId}
}, {
    timestamps: true
});

module.exports = mongoose.model('StockOpname', StockOpnameSchema);