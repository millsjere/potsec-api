const express = require('express');
const { staffProtect, adminProtect } = require('../controllers/authController');
const { createAccount, staffLogin, staffForgetPassword, resetStaffPassword, resendEmailToken, verifyUserAccount, createStudent, createStaff, updateStudentProfile, updateStudentPhoto, updateStudentDocuments, getAllStudents, getAllStaff, updateStaffPhoto, getAllDepartments, createDepartment, getAllProgrammes, createProgramme, updateDepartment, updateProgramme, deleteProgramme, deleteDepartment, getOneProgramme, addCourse, removeCourse, getOneStudent, updateStudentPassword, getFormPrice, checkEmailAndPhone, deleteStudent, admitStudent, getAllApplicants, deleteStaff, updateStaffProfile, sendAdmissionLetter, bulkAddCourses, bulkCreateProgrammes, bulkCreateDepartments, bulkAddStaff, searchStaff, searchProgrammes, searchDepartmentByName, getCounts, searchStudents, resetStaffPasswordByAdmin, updateFormPrice, createAdmissionLetter, updateAdmissionLetter, getAdmissionLetter } = require('../controllers/adminController');
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

router.route('/api/all-applicants').get(adminProtect, getAllApplicants)
router.route('/api/applicant/admit/:id').post(adminProtect, admitStudent)
router.route('/api/applicant/deny/:id').post(adminProtect, deleteStudent)
router.route('/api/applicant/:id').delete(adminProtect, deleteStudent)

// Admin -> Student Routes //
router.route('/api/all-students').get(adminProtect, getAllStudents)
router.route('/api/student/:id').get(adminProtect, getOneStudent)
router.route('/api/student/create').post(adminProtect, createStudent)
router.route('/api/student/profile/:id').patch(adminProtect, updateStudentProfile)
router.route('/api/student/reset-password/:id').patch(adminProtect, updateStudentPassword)
router.route('/api/student/photo/:id').patch(adminProtect, uploadPhoto.single('photo'), updateStudentPhoto)
router.route('/api/student/document/:id').patch(adminProtect, updateStudentDocuments)
router.route('/api/student/send-admission-letter/:id').get(adminProtect, sendAdmissionLetter)

// Admin -> Staff Routes //
router.route('/api/staff/all').get(adminProtect, getAllStaff)
router.route('/api/staff/create').post(adminProtect, createStaff)
router.route('/api/staff/profile/:id').post(adminProtect, updateStaffProfile)
router.route('/api/staff/photo/:id').patch(adminProtect, uploadStaffPhoto.single('photo'), updateStaffPhoto)
router.route('/api/staff/remove/:id').delete(adminProtect, deleteStaff)
router.route('/api/staff/reset-staff-password/:id').post(adminProtect, resetStaffPasswordByAdmin)

// Admin --> Department Routes //
router.route('/api/staff/departments').get(adminProtect, getAllDepartments)
router.route('/api/staff/department/new').post(adminProtect, createDepartment)
router.route('/api/staff/department/:id').patch(adminProtect, updateDepartment)
router.route('/api/staff/department/:id').delete(adminProtect, deleteDepartment)


// Admin --> Programmes Routes //
router.route('/api/staff/programmes').get(adminProtect, getAllProgrammes)
router.route('/api/staff/programmes/new').post(adminProtect, createProgramme)
router.route('/api/staff/programmes/:id').get(adminProtect, getOneProgramme)
router.route('/api/staff/programmes/:id').patch(adminProtect, updateProgramme)
router.route('/api/staff/programmes/:id').delete(adminProtect, deleteProgramme)
router.route('/api/staff/course/add').patch(adminProtect, addCourse)
router.route('/api/staff/course/delete').patch(adminProtect, removeCourse)


// Bulk Upload Routes //
router.route('/api/staff/students/bulk-upload').post(adminProtect, bulkAddCourses)
router.route('/api/staff/users/bulk-upload').post(adminProtect, bulkAddStaff)
router.route('/api/staff/courses/bulk-upload').post(adminProtect, bulkAddCourses)
router.route('/api/staff/programmes/bulk-upload').post(adminProtect, bulkCreateProgrammes)
router.route('/api/staff/departments/bulk-upload').post(adminProtect, bulkCreateDepartments)

// Query Routes //
router.route('/api/search/staff').get(adminProtect, searchStaff)
router.route('/api/search/programmes').get(adminProtect, searchProgrammes)
router.route('/api/search/departments').get(adminProtect, searchDepartmentByName)
router.route('/api/search/students').get(adminProtect, searchStudents)
router.route('/api/dashboard/count').get(adminProtect, getCounts)



// Staff Routes //
router.route('/api/admission/form').get(getFormPrice)
router.route('/api/admission/letter').get(adminProtect, getAdmissionLetter)
router.route('/api/admission/details').patch(adminProtect, updateFormPrice)
router.route('/api/admission/letter').post(adminProtect, createAdmissionLetter)
router.route('/api/admission/letter').patch(adminProtect, updateAdmissionLetter)


module.exports = router