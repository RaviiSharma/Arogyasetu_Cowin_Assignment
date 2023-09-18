const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
    Date: {
        type: String,
        required: [true, "Date is required"],
    },
    AvailableSlots: {
        type: String,
        required: [true, "AvailableSlots is required"],
    },
  },
  { timestamps: true });
  
module.exports = mongoose.model('timeSlot', timeSlotSchema);
