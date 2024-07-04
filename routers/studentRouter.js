const express = require('express');
const { login, forgetUserPassword, resetUserPassword, verifyUserAccount, resendEmailVerification } = require('../controllers/studentController');
const { protect } = require('../controllers/authController');
const router = express.Router();


// Authentication //
router.route('/api/u/login').post(login)
router.route('/api/u/forgot-password').post(forgetUserPassword)
router.route('/api/u/reset-password').post(resetUserPassword)



module.exports = router