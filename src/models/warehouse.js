const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WarehouseSchema = new Schema({
    name: {type: String},
    code: {type: String},
    order: {type: Number},
    isDefault: {type: Boolean, default: false},
    status: {type: Boolean, default: true},
    sections: [{type: Schema.Types.ObjectId, ref: 'Section', default: Array}]
},{
    timestamps: true
});

module.exports = mongoose.model('Warehouse', WarehouseSchema);
