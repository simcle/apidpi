const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerGroupSchema = new Schema({
    name: {type: String, unique: true, required: true},
    code: {type: String},
    description: {type: String},
    userId: {type: Schema.Types.ObjectId}
},{
    timestamps: true
});

module.exports = mongoose.model('CustomerGroup', CustomerGroupSchema);