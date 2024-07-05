const express = require('express');
const { staffProtect } = require('../controllers/authController');
const { createAccount, staffLogin, staffForgetPassword, resetStaffPassword, resendEmailToken, verifyUserAccount } = require('../controllers/staffController');
const router = express.Router();


router.route('/api/staff/create').post(createAccount)
router.route('/api/staff/login').post(staffLogin)
router.route('/api/staff/forgot-password').post(staffProtect, staffForgetPassword)
router.route('/api/staff/reset-password').post(staffProtect, resetStaffPassword)
router.route('/api/staff/resend-email-token').get(staffProtect, resendEmailToken)
router.route('/api/staff/verify-login').post(staffProtect, verifyUserAccount)



module.exports = router