
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    username: {
    type: String,
    required: [true, "username is required"],
    trim: true,
},

password:{
    type: String,
    required: [true, "password is required"],
    trim: true,
},
 
},

{ timestamps: true });

module.exports = mongoose.model('admin', adminSchema)




