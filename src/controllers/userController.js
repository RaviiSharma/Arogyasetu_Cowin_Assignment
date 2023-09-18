const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const moment = require('moment');

const UserModel = require("../models/userModel");
const TimeSlotModel = require('../models/timeSlotModel'); // Import your TimeSlot model
const VaccinationRecordModel = require('../models/vaccinationRecordModel'); 

const {isValidInputBody,isValidOnlyCharacters,isValidPhone,
    isValidPassword,isValidNumber,isValidObjectId,isValidPincode,isValidAadhaar}= require("../utilities/validator");


//*********************************************USER REGISTRATION******************************************** */


const userRegistration = async function (req, res) {
    try {
        console.log('userRegistration api');
        const requestBody = req.body;

        if (isValidInputBody(req.query)) {
            return res
                .status(400)
                .send({ status: false, message: "page not found" });
        }
      

        // Validate mandatory fields
        const mandatoryFields = ['Name', 'PhoneNumber', 'Age', 'Pincode', 'AadharNo'];
        for (const field of mandatoryFields) {
            if (!requestBody[field]) {
                return res.status(400).send({ status: false, message: `${field} is required` });
            }
        }

        // Destructuring the request body
        const { Name, PhoneNumber, Age, AadharNo, Pincode,Password } = requestBody;

        // Validate Name
        if (!isValidOnlyCharacters(Name)) {
            return res.status(400).send({ status: false, message: "Name should contain only alphabets" });
        }

        // Validate PhoneNumber
        if (!isValidPhone(PhoneNumber)) {
            return res.status(400).send({ status: false, message: "Phone number should be a valid mobile number" });
        }

        // Check if PhoneNumber already exists
        const existingUser = await UserModel.findOne({ PhoneNumber });
        if (existingUser) {
            return res.status(400).send({ status: false, message: "Phone number already exists" });
        }

        // Validate Age
        if (!isValidNumber(Age)) {
            return res.status(400).send({ status: false, message: "Age should be a valid number" });
        }

        // Validate AadharNo
        if (!isValidAadhaar(AadharNo)) {
            return res.status(400).send({ status: false, message: "Aadhar number should be valid" });
        }

        // Validate Pincode
        if (!isValidPincode(Pincode)) {
            return res.status(400).send({ status: false, message: "Pincode should be valid" });
        }

        // Matching pincode and city by axios call
        const options = {
            method: "GET",
            url: `https://api.postalpincode.in/pincode/${Pincode}`,
        };

        const pincodeDetail = await axios(options);

        if (!pincodeDetail || !pincodeDetail.data || !pincodeDetail.data[0] || !pincodeDetail.data[0].PostOffice) {
            return res.status(400).send({ status: false, message: "Pincode should be valid" });
        }

        if (!isValidPassword(Password)) {
            return res.status(400).send({ status: false, message: "Password should 4 to 15 with special char " });
        }


        const salt = await bcrypt.genSalt(13);
        const encryptedPassword = await bcrypt.hash(Password, salt);
        // Create a new user
        const newUser = await UserModel.create({
            Name: Name,
            PhoneNumber: PhoneNumber.trim(),
            Age: Age,
            AadharNo: AadharNo,
            Pincode: Pincode,
            Password:encryptedPassword
        });

        res.status(201).send({ status: true, message: "User successfully registered", data: newUser });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};


//**********************************************USER LOGIN*************************************************** */

const userLogin = async function(req, res) {
    try {
        const { PhoneNumber, Password } = req.body;
        
        if (isValidInputBody(req.query)) {
            return res
                .status(400)
                .send({ status: false, message: "page not found" });
        }
        
        if (!isValidInputBody(req.body)) {
            return res.status(400).send({
              status: false,
              message: "data is required."
            });
          }
        
      
        if ( !PhoneNumber || !Password) {
            return res.status(400).send({
              status: false,
              message: "data required or Both PhoneNumber and Password are required fields in the request body."
            });
          }

        if (!PhoneNumber || !Password) {
            return res.status(400).json({ status: false, message: 'PhoneNumber and Password are required' });
        }

        const user = await UserModel.findOne({ PhoneNumber });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(Password, user.Password);

        if (!passwordMatch) {
            return res.status(401).json({ status: false, message: 'Incorrect password' });
        }

        const payload = { userId: user._id };
        const secretKey = '123'; // Replace with your secret key
        const options = { expiresIn: '10h' }; // Token expiration time

        const token = jwt.sign(payload, secretKey, options);

        return res.status(200).json({ status: true, message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};



const registerTimeSlot = async (req, res) => {
    try {
        const { doseStatus, dateTime } = req.body;
          
        if (isValidInputBody(req.query)) {
            return res
                .status(400)
                .send({ status: false, message: "page not found" });
        }
        if (!isValidInputBody(req.body)) {
            return res.status(400).send({
              status: false,
              message: "data is required."
            });
          }
        
        if ( !doseStatus || !dateTime) {
            return res.status(400).send({
              status: false,
              message: "data required or Both doseStatus and dateTime are required fields in the request body."
            });
          }
        
        console.log("body", req.body);

        // Validate input data
        if (!doseStatus || !dateTime) {
            return res.status(400).json({ status: false, message: 'doseStatus and dateTime are required' });
        }

        const validDate = moment(dateTime, 'DD/MM/YYYY HH:mm:ss').toDate();

        // Format the date as "D MMM h A" (e.g., "1st June 11 AM")
       const formattedDate = moment(validDate).format('Do MMM h A');
            
             console.log('formattedDate',formattedDate)

        // Create a new time slot
        const newTimeSlot = new TimeSlotModel({
            AvailableSlots: doseStatus,
            Date: formattedDate,
        });

        // Save the new time slot to the database
        await newTimeSlot.save();

        return res.status(200).json({ status: true, message: 'Time slot registered successfully', newTimeSlot });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};

//3.Available Time Slots (GET /time-slots):
const availableTimeSlots = async (req, res) => {
    try {
        const { userId, date } = req.query;

        if (isValidInputBody(req.body)) {
            return res
                .status(400)
                .send({ status: false, message: "page not found" });
        }
      
      
        if (!isValidInputBody(req.query)) {
            return res.status(400).send({
              status: false,
              message: "data is required."
            });
          }
        

        // Validate user input
        if (!userId  || !date) {
            return res.status(400).json({ status: false, message: 'userId, and date are required or date format should be 17/09/2023' });
        }

        const userDetailByUserId = await VaccinationRecordModel.findOne({ UserId: userId }).select('Dose Status');

        if (!userDetailByUserId) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Convert the provided date "17/09/2023" to "17th Sep" format
        const formattedDate = moment(date, 'DD/MM/YYYY').format('Do MMM');
        console.log('Formatted Date:', formattedDate);

        if (userDetailByUserId.Dose === '1st dose' && userDetailByUserId.Status === 'registered') {
            // Fetch available time slots for the first dose based on the formatted date
            var timeSlots = await TimeSlotModel.find({
                AvailableSlots: '1st dose',
                Date: { $regex: formattedDate, $options: 'i' }, // Using regex to match part of the date
            }).select('Date AvailableSlots');

            if (timeSlots.length === 0) {
                return res.status(200).json({ status: true, message: 'No available time slots for the specified date' });
            }
        } else if (userDetailByUserId.Dose === '1st dose' && userDetailByUserId.Status === 'vaccinated'||userDetailByUserId.Dose === '2nd dose' && userDetailByUserId.Status === 'registered') {
            // Fetch available time slots for the second dose based on the formatted date
           var timeSlots = await TimeSlotModel.find({
                AvailableSlots: '2nd dose',
                Date: { $regex: formattedDate, $options: 'i' }, // Using regex to match part of the date
            }).select('Date AvailableSlots');

            if (timeSlots.length === 0) {
                return res.status(200).json({ status: true, message: 'No available time slots for the specified date' });
            }
        } else {
            return res.status(400).json({ status: false, message: ' no slots aavilable' });
        }

        return res.status(200).json({ status: true, message: 'Available time slots', totalSlots: timeSlots.length, data: timeSlots });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};




//4.registerFirstDose
const registerFirstDose = async (req, res) => {
    try {
        console.log("registerFirstDose api")
        const { userId, dateTime,Status } = req.body;

        if (isValidInputBody(req.query)) {
            return res
                .status(400)
                .send({ status: false, message: "page not found" });
        }

        
        // Validate input data
        if (!userId || !dateTime ||!Status) {
            return res.status(400).json({ status: false, message: 'userId, and dateTime are required' });
        }


        const existUser = await VaccinationRecordModel.findOne({
            UserId: userId,
            Dose: '1st dose',
            $or: [{ Status: 'vaccinated' }, { Status: 'registered' }],
          });
          
          if (existUser) {
            return res.status(400).json({ status: false, message: 'User is already registered or vaccinated the first dose' });
          }
          
        // Parse the dateTime string into a Date object
        const validDate = moment(dateTime, 'DD/MM/YYYY HH:mm:ss').toDate();

   // Format the date as "D MMM h A" (e.g., "1st June 11 AM")
  const formattedDate = moment(validDate).format('Do MMM h A');
       
        console.log('formattedDate',formattedDate)

  // Validate the Status field
  if (Status !== 'registered' && Status !== 'vaccinated') {
    return res.status(400).json({ status: false, message: 'Invalid status value. Status should be either "registered" or "vaccinated"' });
}

        // Create a new vaccination record
        const newVaccinationRecord = new VaccinationRecordModel({
            UserId: userId,
            Dose: '1st dose',
            Slot: formattedDate, // Assuming you want to store the slot as a Date object
            Status: Status, // Initial status is registered
        });

        // Save the new vaccination record to the database
        await newVaccinationRecord.save();

        return res.status(200).json({ status: true, message: 'Vaccine slot registered successfully', data: newVaccinationRecord });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};



//5.registerSecondDose
const registerSecondDose = async (req, res) => {
    try {
        const { userId, Status, dateTime } = req.body;

        if (isValidInputBody(req.query)) {
            return res
                .status(400)
                .send({ status: false, message: "page not found" });
        }

    
        // Validate input data
        if (!req.body||!userId || !dateTime ||!Status) {
            return res.status(400).json({ status: false, message: 'userId, and dateTime are required' });
        }


        const existUser = await VaccinationRecordModel.findOne({
            UserId: userId,
            Dose: '2nd dose',
            $or: [{ Status: 'vaccinated' }, { Status: 'registered' }],
          });
          
          if (existUser) {
            return res.status(400).json({ status: false, message: 'User is already registered or vaccinated the second dose' });
          }

        // Check if the user has completed the first dose
        const firstDoseRecord = await VaccinationRecordModel.findOne({
            UserId: userId,
            Dose: '1st dose',
            $or: [{ Status: 'vaccinated' }, { Status: 'registered' }],
            
        });

        if (!firstDoseRecord) {
            return res.status(400).json({ status: false, message: 'You must complete the first dose before scheduling the second dose' });
        }

        const validDate = moment(dateTime, 'DD/MM/YYYY HH:mm:ss').toDate();

        // Format the date as "D MMM h A" (e.g., "1st June 11 AM")
        const formattedDate = moment(validDate).format('Do MMM h A');

        console.log('formattedDate', formattedDate);

        // Validate the Status field
        if (Status !== 'registered' && Status !== 'vaccinated') {
            return res.status(400).json({ status: false, message: 'Invalid status value. Status should be either "registered" or "vaccinated"' });
        }

        // Register the second dose for the user
        const secondDoseRecord = new VaccinationRecordModel({
            UserId: userId,
            Dose: '2nd dose',
            Slot: formattedDate, // Assuming you want to store the slot as a Date object
            Status: Status,
        });

        await secondDoseRecord.save();

        return res.status(200).json({ status: true, message: 'Second dose registered successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};

const updateSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { userId, newDateTime } = req.body;

        // Validate user input
        if (!slotId || !userId || !newDateTime) {
            return res.status(400).json({ status: false, message: 'slotId, userId, and newDateTime are required' });
        }
        
        if (!isValidObjectId(slotId)) {
            return res.status(400).send({ status: false, message: 'Enter a valid slotId' });
        }

        // Find the existing slot
        const existingSlot = await VaccinationRecordModel.findOne({
            _id: slotId,
            UserId: userId
        });

        if (!existingSlot) {
            return res.status(404).json({ status: false, message: 'Slot not found for the given user' });
        }

        // Check if the slot is registered and can be updated within 24 hours
        const scheduledTime = moment(existingSlot.Slot, 'Do MMM h A');
        const currentTime = moment();
        const hoursDifference = scheduledTime.diff(currentTime, 'hours');

        if (existingSlot.Status !== 'registered' || hoursDifference > 24) {
            return res.status(400).json({ status: false, message: 'You can only update a registered slot up to 24 hours before the scheduled time' });
        }

        // Update the slot with the new date and time
        const newFormattedDate = moment(newDateTime, 'DD/MM/YYYY HH:mm:ss').format('Do MMM h A');
        existingSlot.Slot = newFormattedDate;
        await existingSlot.save();

        return res.status(200).json({ status: true, message: 'Slot updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};






  



module.exports = {
    userRegistration,
    userLogin,
    availableTimeSlots,
    registerTimeSlot,
    registerFirstDose,
    registerSecondDose,
    updateSlot
    
};