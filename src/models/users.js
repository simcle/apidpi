const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    avatar: {type: String, default: null},
    refreshToken: {type: String, default: null}
}, {
    timestamps: true
});

module.exports = mongoose.model('Users', UserSchema);