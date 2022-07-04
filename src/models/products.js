const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    images: {type: Array},
    name: {type: String},
    brandId: {type: Schema.Types.ObjectId, ref: 'Brand'},
    categoriesId: [{type: Schema.Types.ObjectId, ref: 'Category'}],
    condition: {type: String},
    description: {type: String},
    videos: {type: Array},
    sku: {type: String, unique: true},
    isSerialNumber: {type: Boolean},
    currency: {type: String},
    currencySymbol: {type: String},
    purchasePrice: {type: Number},
    sellingPrice: {type: Number},
    netPrice: {type: Number},
    wholesale: {type: Array},
    measurements: {type: Object},
    notes: {type: Object},
    attachments: {type: Array},
    accessories: [{type: Schema.Types.ObjectId, ref: 'Product'}],
    preorder: {type: Object},
    status: {type: Boolean, default: true},
    stock: {type: Number, default: 0}
},{
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);