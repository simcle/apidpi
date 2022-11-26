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
    isSerialNumber: {type: Boolean, default: false},
    currency: {type: String, default: ''},
    currencySymbol: {type: String, default: 0},
    purchasePrice: {type: Number, default: 0},
    sellingPrice: {type: Number},
    netPrice: {type: Number, default: 0},
    wholesale: {type: Array},
    measurements: {type: Object},
    notes: {
        status: {type: Boolean, default: false},
        internal: {type: String, default: ''},
        external: {type: String, default: ''},
    },
    attachments: {type: Array},
    accessories: [{type: Schema.Types.ObjectId, ref: 'Product'}],
    preorder: {
        isActive: {type: Boolean, default: false},
        duration: {type: String, default: ''},
        timeUnit: {type: String, default: 'DAY'}
    },
    status: {type: Boolean, default: false},
    stock: {type: Number, default: 0},
    tokopediaId: {type: String},
    tokopediaUrl: {type: String},
    isEdited: {type: Boolean, default: true}
},{
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);