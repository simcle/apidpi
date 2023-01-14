const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    name: {type: String},
    customerGroup: {type: String},
    customerCode: {type: String, default: null},
    parentId: {type: Schema.Types.ObjectId, default: null},
    npwp: {type: String, default: null},
    type: {type: String, default: 'contact'},
    image: {type: String, default: null},
    address: {
        street: {type: String},
        street2: {type: String},
        subdistrictId: {type: Number},
        subdistrictName: {type: String},
        cityId: {type: Number},
        cityName: {type: String},
        provinceId: {type: Number},
        provinceName: {type: String},
        zip: {type: String},
    },
    contact: {
        phone: {type: String},
        mobile: {type: String},
        email: {type: String},
        website: {type: String}
    },
    tags: {type: Array},
    remarks: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
},{
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);