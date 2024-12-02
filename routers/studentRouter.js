const express = require('express');
const { login, forgetUserPassword, resetUserPassword, verifyUserAccount, resendEmailVerification, changeUserPassword } = require('../controllers/studentController');
const { protect, studentProtect } = require('../controllers/authController');
const router = express.Router();


// Authentication //
router.route('/api/u/login').post(login)
router.route('/api/u/forgot-password').post(forgetUserPassword)
router.route('/api/u/reset-password').post(resetUserPassword)
router.route('/api/u/verify-login').post(studentProtect, verifyUserAccount)
router.route('/api/u/resend-email-token').get(studentProtect, resendEmailVerification)
router.route('/api/u/update-password').patch(studentProtect, changeUserPassword)




module.exports = router