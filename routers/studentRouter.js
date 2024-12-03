const express = require('express');
const { login, forgetUserPassword, resetUserPassword, verifyUserAccount, resendEmailVerification, changeUserPassword } = require('../controllers/studentController');
const { studentProtect } = require('../controllers/authController');
const { checkEmailAndPhone, createStudent, updateStudentProfile, updateStudentPhoto } = require('../controllers/staffController');
const { studentPhotoStorage } = require('../cloudinary');
const multer = require('multer');
const router = express.Router();

const uploadPhoto = multer({
    storage: studentPhotoStorage,
    fileFilter: (req, file, cb) => {
        // console.log('RAW FILE FOR PROCESSING ==>', file)
        if (file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(null, true);
        } else {
            return cb(null, false);
        }
    }
})

// Authentication //
router.route('/api/u/login').post(login)
router.route('/api/u/forgot-password').post(forgetUserPassword)
router.route('/api/u/reset-password').post(resetUserPassword)
router.route('/api/u/verify-login').post(studentProtect, verifyUserAccount)
router.route('/api/u/resend-email-token').get(studentProtect, resendEmailVerification)
router.route('/api/u/update-password').patch(studentProtect, changeUserPassword)

// Applicants
router.route('/api/applicant/check').post(checkEmailAndPhone)
router.route('/api/applicant/new').post(createStudent)
router.route('/api/applicant/update/:id').patch(studentProtect, updateStudentProfile)
router.route('/api/applicant/photo/:id').patch(studentProtect, uploadPhoto.single('photo'), updateStudentPhoto)



module.exports = router