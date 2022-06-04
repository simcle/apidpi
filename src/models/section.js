const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SectionSchema = new Schema({
    warehouseId: {type: Schema.Types.ObjectId, ref: 'Warehouse'},
    name: {type: String}
});

module.exports = mongoose.model('Section', SectionSchema);