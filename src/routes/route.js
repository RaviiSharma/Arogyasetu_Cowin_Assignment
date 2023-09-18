const express = require('express')
const router = express.Router()
const UserController = require('../controllers/userController')
const AdminController = require('../controllers/adminController')

 const Auth = require('../middleWares/auth')



//test-api
router.get('/test-me', function(req, res) {
    res.send({ status: true, message: "test-api working fine" })
})


router.post('/register', UserController.userRegistration);
router.post('/login', UserController.userLogin);

router.get('/availableTimeSlots',Auth.authentication, UserController.availableTimeSlots);
router.post('/registerTimeSlot',Auth.authentication, UserController.registerTimeSlot);

router.post('/registerFirstDose',Auth.authentication, Auth.authorization, UserController.registerFirstDose);
router.post('/registerSecondDose',Auth.authentication, Auth.authorization,UserController.registerSecondDose);
router.put('/updateSlot/:slotId',Auth.authentication,Auth.authorization,UserController.updateSlot);


router.post('/admin/adminRegister', AdminController.adminRegister);
router.post('/admin/adminLogin', AdminController.adminLogin);
router.get('/admin/filterUsers', Auth.authenticateAdmin, AdminController.filterUsers);
router.get('/admin/getRegisteredVaccineSlots', Auth.authenticateAdmin, AdminController.getRegisteredVaccineSlots);














router.all("/*", function (req, res) {
    res
        .status(400)
        .send({ status: false, message: "invalid http request" });
});

module.exports = router