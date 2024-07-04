const express = require('express');
const { staffProtect } = require('../controllers/authController');
const { createAccount, staffLogin, staffForgetPassword, resetStaffPassword } = require('../controllers/staffController');
const router = express.Router();


router.route('/api/staff/create').post(createAccount)
router.route('/api/staff/login').post(staffLogin)
router.route('/api/staff/forgot-password').post(staffProtect, staffForgetPassword)
router.route('/api/staff/reset-password').post(staffProtect, resetStaffPassword)



module.exports = router