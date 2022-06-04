const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CreditTermSchema = new Schema({
    code: {type: String},
    duration: {type: Number},
    description: {type: String}
},{
    timestamps: true
});

module.exports = mongoose.model('CreditTerm', CreditTermSchema)