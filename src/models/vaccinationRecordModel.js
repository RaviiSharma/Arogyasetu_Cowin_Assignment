const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const vaccinationRecordSchema = new mongoose.Schema({
    UserId: {
        type: ObjectId,
        ref: "user",
        required: [true, "UserId is required"],
    },
    Dose: {
        type: String,
        enum: ['1st dose', '2nd dose'], // 'first' or 'second'
    }, 
    Slot: String, // e.g., '1st June 11 AM'
    Status: {
        type: String,
        enum: ["registered", "vaccinated"], // 'registered' or 'vaccinated'
    }, 
  },{ timestamps: true });
  
module.exports = mongoose.model('vaccinationRecord', vaccinationRecordSchema);
