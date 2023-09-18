
const mongoose = require("mongoose");
const {isValidPhone} = require("../utilities/validator")

const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: [true, "User First Name is required"],
    trim: true,
},
  PhoneNumber: {
    type: String,
    required: [true, "User phone number is required"],
    unique: [true, "Phone number already exist"],
    validate: [isValidPhone, "Please enter a valid phone number"],
    trim: true,
},
  Age: {
    type: Number,
    required: [true, "Age is required"],
},
  Pincode: {
    type: Number,
    required: [true, "pincode is required"],
},
  AadharNo:{
    type: Number,
    required: [true, "aadharNo is required"],
},
  Password:{
    type: String,
    
},
  FirstDose: {
    type: Date,
},
  SecondDose: {
    type: Date,
},
},

{ timestamps: true });

module.exports = mongoose.model('user', userSchema)




