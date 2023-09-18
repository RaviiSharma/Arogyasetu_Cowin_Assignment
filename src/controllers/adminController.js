

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require('moment');


const UserModel = require("../models/userModel");
const TimeSlotModel = require('../models/timeSlotModel'); 
const VaccinationRecordModel = require('../models/vaccinationRecordModel'); 
const AdminModel = require("../models/adminModel");


const {isValidInputBody,isValidPassword,}= require("../utilities/validator");


    function generateAdminToken(admin) {
      const payload = { id: admin._id, username: admin.username };
      const secretKey = '123'; // Replace with your secret key
      const options = { expiresIn: '10h' }; // Token expiration time
    
      return jwt.sign(payload, secretKey, options);
    }
    
    // Endpoint for admin registration
    const adminRegister = async (req, res) => {
      try {
        const { username, password } = req.body;

        if (isValidInputBody(req.query)) {
          return res
              .status(400)
              .send({ status: false, message: "page not found" });
      }
    
      if (!isValidInputBody(req.body)) {
          return res
              .status(400)
              .send({status: false,message: "data is required"});
      }
    
        // Check if the username already exists
        const existingAdmin = await AdminModel.findOne({ username });
    
        if (existingAdmin) {
          return res.status(400).json({ status: false, message: 'Username already exists' });
        }
    
        if (!isValidPassword(password)) {
          return res.status(400).send({ status: false, message: "Password should 4 to 15 with special char" });
      }

        // Hash the admin's password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
    
        // Create a new admin document
        const newAdmin = new AdminModel({
          username,
          password: hashedPassword,
        });
    
        // Save the new admin to the database
        await newAdmin.save();
    
        res.status(201).json({ status: true, message: 'Admin registered successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Server error' });
      }
    };
    
    

const adminLogin =async (req, res) => {
  try {
    const { username, password } = req.body;

    if (isValidInputBody(req.query)) {
      return res
          .status(400)
          .send({ status: false, message: "page not found" });
  }

  if (!isValidInputBody(req.body)) {
      return res
          .status(400)
          .send({status: false,message: "data is required"});
  }

    const admin = await AdminModel.findOne({ username });
    if (!admin) {
      return res.status(401).json({ status: false, message: 'no username found' });
  }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
        return res.status(401).json({ status: false, message: 'Invalid credentials' });
    }
    // If credentials are valid, generate a JWT token and send it back as a response
    const token = generateAdminToken(admin); // Implement this function to generate a token
    res.status(200).json({ status: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


const filterUsers = async (req, res) => {
    try {
      // Define filter options based on query parameters
      const filters = {};

        //no data is required from query params
        if (isValidInputBody(req.body)) {
          return res
              .status(400)
              .send({ status: false, message: "page not found" });
      }

      if (!isValidInputBody(req.query)) {
          return res
              .status(400)
              .send({status: false,message: "data is required for filter"});
      }
  
      if (req.query.age) {
        filters.Age = parseInt(req.query.age); // Convert age to integer
      }
  
      if (req.query.pincode) {
        filters.Pincode = parseInt(req.query.pincode); // Convert pincode to integer
      }
  
      // Find users based on the filters
      const users = await UserModel.find(filters);
  
      if (users.length === 0) {
        return res.status(400).json({ status: false, message: 'No data found' });
      }
  
      // Check if req.query.vaccinationStatus exists before applying the filter
      if (req.query.vaccinationStatus) {
        // Filter users based on the provided vaccinationStatus
        var usersWithVaccinationStatus = await Promise.all(users.map(async (user) => {
          var vaccinationRecord = await VaccinationRecordModel.findOne({ UserId: user._id, Status: req.query.vaccinationStatus });
      
          if (vaccinationRecord) {
            return {
              ...user.toObject(),
              Status: vaccinationRecord.Status,
            };
          } else {
            // Handle the case where no matching vaccination record is found
            return null;
          }
        }));
      
        // Remove null entries from the array (users with no matching vaccination record)
        usersWithVaccinationStatus = usersWithVaccinationStatus.filter(user => user !== null);
      } else {
        // If req.query.vaccinationStatus is not provided, include all users without applying the filter
        var usersWithVaccinationStatus = users.map((user) => ({
          ...user.toObject(),
        }));
      }
      
      if (usersWithVaccinationStatus.length === 0) {
        // Handle the case where no users match the provided vaccinationStatus
        return res.status(400).json({ status: false, message: 'No users found with the specified vaccinationStatus' });
      }
  
      const totalUsers = usersWithVaccinationStatus.length;
  
      res.status(200).json({ status: true, totalUsers, users: usersWithVaccinationStatus });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Server error' });
    }
  };



const startDate = new Date('2021-06-01');
const endDate = new Date('2021-06-30');
const startTime = 10 * 60; // 10 AM in minutes
const endTime = 17 * 60; // 5 PM in minutes
const slotDuration = 30; // Slot duration in minutes
const totalVaccineDoses = 4200;
const dosesPerSlot = 10;

const availableSlots = {};

const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMins = mins.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMins} ${ampm}`;
};

const initializeSlotsForDate = (date) => {
    const formattedDate = moment(date, 'YYYY-MM-DD').format('Do MMM');

    const slots = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
        slots.push({
            start: formatTime(currentTime), // Format the time
            end: formatTime(currentTime + slotDuration), // Format the time
            availableDoses: dosesPerSlot,
        });
        currentTime += slotDuration; // Increment by slot duration in minutes
    }

    availableSlots[formattedDate] = {
        '1st dose': [...slots],
        '2nd dose': [...slots],
    };
};

let currentDate = new Date(startDate);
while (currentDate <= endDate) {
    initializeSlotsForDate(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
}

const getRegisteredVaccineSlots = async (req, res) => {
    try {

        let { date } = req.query;
        if (isValidInputBody(req.body)) {
          return res
              .status(400)
              .send({ status: false, message: "page not found" });
      }

      if (!isValidInputBody(req.query)) {
          return res
              .status(400)
              .send({status: false,message: "data is required"});
      }
        date = moment(date, 'DD/MM/YYYY').format('Do MMM');

        if (!date || !availableSlots[date]) {
            return res.status(400).json({ message: 'Invalid date or date format should be 18/06/2021.' });
        }

        const slotsData = availableSlots[date]; // Retrieve slots for the given date

        const results = await VaccinationRecordModel.aggregate([
            {
                $match: {
                    Slot: { $regex: '^' + date, $options: 'i' },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    slots: { $push: "$Slot" },
                    Dose:{$push:"$Dose"}
                },
            },
        ]).exec();

        // Initialize a variable to keep track of the total doses booked
        let totalDosesBooked = 0;
        console.log('results',results)
       
      for (const result of results) {
        const { count, slots,Dose } = result;
        console.log('count', count);
        console.log('slots', slots);
    
        totalDosesBooked += count;
    
        const times = slots.map((slot) => {
            const match = slot.match(/\d{1,2} /); // Extract "H AM" or "H PM" part using regular expression
            return match ? parseInt(match[0], 10) : ''; // Parse the matched part as an integer or return an empty string if not found
        });
    
        console.log('times', times);
    
        for (const slotType of ['1st dose', '2nd dose']) {
          slotsData[slotType].forEach((slot) => {
              // Extract hours from slot.start and slot.end, and check if they match any in the 'times' array
              const startHours = parseInt(slot.start.split(' ')[0].split(':')[0], 10); // Extract and parse hours from slot.start
              const endHours = parseInt(slot.end.split(' ')[0].split(':')[0], 10); // Extract and parse hours from slot.end
      
              console.log('startHours', startHours);
              console.log('endHours', endHours);
      
              if (times.includes(startHours) || times.includes(endHours)) {
                  console.log('match', times.includes(startHours));
                  console.log('match2', times.includes(endHours));
      
                  // Check if doses have already been deducted for this slot
                  if (!slot.dosesDeducted) {
                      // Deduct booked doses
                      slot.availableDoses -= 1;
      
                      // Set the flag to indicate that doses have been deducted for this slot
                      slot.dosesDeducted = true;
                  }
              }
          });
      }
      
    }
    
      // Calculate totalAvailableDoses after deducting booked doses
      const totalAvailableDoses = totalVaccineDoses - totalDosesBooked;
      
      // Mark slots as unavailable if the available doses reach 0
      for (const slotType of ['1st dose', '2nd dose']) {
          slotsData[slotType].forEach((slot) => {
              if (slot.availableDoses <= 0) {
                  // If there are no available doses, mark the slot as unavailable
                  slot.availableDoses = 0;
              }
          });
      }
      
        res.json({
            date,
            '1st dose': slotsData['1st dose'],
            '2nd dose': slotsData['2nd dose'],
            totalAvailableDoses,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Server error' });
    }
};




module.exports = {adminRegister,adminLogin,filterUsers,getRegisteredVaccineSlots};

