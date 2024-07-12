const express = require('express');
const { staffProtect, adminProtect } = require('../controllers/authController');
const { createAccount, staffLogin, staffForgetPassword, resetStaffPassword, resendEmailToken, verifyUserAccount, createStudent, createStaff, updateStudentProfile, updateStudentPhoto, updateStudentDocuments, getAllStudents, getAllStaff, updateStaffPhoto } = require('../controllers/staffController');
const router = express.Router();
const multer = require('multer');
const { studentPhotoStorage, staffPhotoStorage } = require('../cloudinary');

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
const uploadStaffPhoto = multer({
    storage: staffPhotoStorage,
    fileFilter: (req, file, cb) => {
        // console.log('RAW FILE FOR PROCESSING ==>', file)
        if (file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(null, true);
        } else {
            return cb(null, false);
        }
    }
})


// Auth Routes //
// router.route('/api/staff/create').post(createAccount)
router.route('/api/staff/login').post(staffLogin)
router.route('/api/staff/forgot-password').post(staffProtect, staffForgetPassword)
router.route('/api/staff/reset-password').post(staffProtect, resetStaffPassword)
router.route('/api/staff/resend-email-token').get(staffProtect, resendEmailToken)
router.route('/api/staff/verify-login').post(staffProtect, verifyUserAccount)

// Admin -> Student Routes //
router.route('/api/student/all').get(adminProtect, getAllStudents)
router.route('/api/student/create').post(adminProtect, createStudent)
router.route('/api/student/profile/:id').patch(adminProtect, updateStudentProfile)
router.route('/api/student/photo/:id').patch(adminProtect, uploadPhoto.single('photo'), updateStudentPhoto)
router.route('/api/student/document/:id').patch(adminProtect, updateStudentDocuments)

// Admin -> Staff Routes //
router.route('/api/staff/all').get(adminProtect, getAllStaff)
router.route('/api/staff/create').post(adminProtect, createStaff)
router.route('/api/staff/photo/:id').patch(adminProtect, uploadStaffPhoto.single('photo'), updateStaffPhoto)



// Staff Routes //



module.exports = router