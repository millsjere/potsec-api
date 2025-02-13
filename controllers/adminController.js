const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const Staff = require('../models/staffModel')
const Student = require('../models/studentModel');
const Notify = require('../models/notifyModel');
const { registerMessage, codeMessage, welcomeMessage } = require('../mailer/templates');
const sgMail = require('@sendgrid/mail')
const { sendSMS } = require('../sms/ghsms');
const Department = require('../models/departmentModel');
const Programmes = require('../models/programmeModel');
const FormPrice = require('../models/priceModel');
const Course = require('../models/CourseModel');
const Students = require('../models/studentModel');
const AdmissionLetter = require('../models/AdmissionLetterModel');
const { sendAdmissionLetter } = require('../mailer/admissionTemplate');
const ResultsUpload = require('../models/ResultFilesModel');
const GradeModel = require('../models/GradeModel');



const encryptPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        console.log('Hashed password:', hash);
    } catch (err) {
        console.error('Error hashing password:', err);
    }
};


const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
}


const genDigits = () => {
    const code = Math.floor(100000 + Math.random() * 900000)
    return code
}

const generatePassword = () => {
    const code = Math.floor(10000000 + Math.random() * 900000)
    return `POTSEC${code}`
}

const generateIndex = async () => {
    const year = new Date().getFullYear().toString().slice(-2)
    const month = new Date().getMonth();
    const nextIndex = await Student.countDocuments({ role: 'student' }) + 1;
    const paddedIndex = nextIndex.toString().padStart(4, '0');
    return `PTC${year}${month}${paddedIndex}`;
}

const generateStaffID = async () => {
    const year = new Date().getFullYear().toString().slice(-2)
    const nextIndex = await Staff.countDocuments({ role: 'staff' }) + 1;
    const paddedIndex = nextIndex.toString().padStart(4, '0');
    return `PTC-STF${year}-${paddedIndex}`;
}

const tokenMessage = (user, code) => {
    const msg = {
        to: `${user.email}`, // Change to your recipient
        from: "POTSEC <noreply@noreply@potsec.edu.gh>", // Change to your verified sender
        subject: "Verify Login",
        html: codeMessage(
            user.surname,
            `Use this code to verify your login request. If you did not initiate this, contact support@potsec.edu.gh`,
            code
        ),
    };
    return msg
}

const getFormattedAdmissionDate = (date) => {
    const options = { month: 'short' }; // Short month format (e.g., SEP)
    const month = date.toLocaleString('en-US', options).toUpperCase(); // Convert to uppercase
    const year = date.getFullYear(); // Get the full year
    return `${month}${year}`;
};

const getFutureFormattedDate = (monthsAhead = 0, yearsAhead = 0) => {
    const date = new Date();
    // Add years and months
    date.setFullYear(date.getFullYear() + yearsAhead);
    date.setMonth(date.getMonth() + monthsAhead);

    const options = { month: 'short' };  // Format month as short (e.g., SEP)
    const month = date.toLocaleString('en-US', options).toUpperCase();
    const year = date.getFullYear();

    return `${month}${year}`;
};

// GET FORM PRICE //
exports.getFormPrice = async (req, res) => {
    try {
        const price = await FormPrice.find()

        res.status(200).json({
            status: "success",
            responseCode: 200,
            data: price[0]
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}


exports.updateFormPrice = async (req, res) => {
    try {
        const { amount, month, year, closingDate } = req.body;

        // Validate input
        if (!amount || !month || !year) {
            return res.status(400).json({
                status: "failed",
                message: "Please provide amount, month, and year.",
            });
        }

        // Update the existing form price (assuming only one exists)
        const updatedPrice = await FormPrice.findOneAndUpdate(
            {},                                // Match any document
            { amount, month, year, closingDate },// Update all fields
            { new: true }                      // Return the updated document
        );

        // If no form price was found
        if (!updatedPrice) {
            return res.status(404).json({
                status: "failed",
                message: "Form price not found.",
            });
        }

        // Successful response
        res.status(200).json({
            status: "success",
            responseCode: 200,
            message: "Form price updated successfully.",
            data: updatedPrice,
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "An error occurred while updating the form price.",
            error: error.message,
        });
    }
};


// USER SIGNUP
exports.createAccount = async (req, res) => {
    try {
        //chech if username and email has been taken
        const { othernames, surname, email, phone, gender, programme, password, department, campus } = sampleData;
        const userExist = await Staff.findOne({ email })
        if (userExist) {
            //send res to client
            res.status(400).json({
                status: "failed",
                responseCode: 400,
                message: 'User already exist with this email'
            });
        } else {
            const newPassword = await hashPassword(password);
            const user = await Staff.create({
                othernames, surname, email, phone, gender, programme, department, campus,
                password: newPassword,
            });

            if (!user) {
                throw Error("Something went wrong. Please try again");
            }

            // const activationToken = genDigits();
            await user.save();

            //send res to client
            res.status(200).json({
                status: "success",
                message: 'New staff account created, successfully'
            });

        }

    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};

// LOGIN
exports.staffLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await Staff.findOne({ email }).select('+password +verificationCode +verificationCodeExpiry')
        if (!user) {
            //send res to client
            res.status(401).json({
                status: "failed",
                responseCode: 401,
                message: 'Invaid credentials. Try again'
            });
        } else {
            // verify password
            const verified = await bcrypt.compare(password, user.password);
            if (verified) {
                // sign token
                let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: "5h",
                });

                //send SMS code
                const smsCode = genDigits()
                user.verificationCode = smsCode
                user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000).getTime()
                user.isLoginVerified = false
                await user.save()

                // send email
                const msg = {
                    to: `${user.email}`, // Change to your recipient
                    from: "POTSEC <noreply@potsec.edu.gh>", // Change to your verified sender
                    subject: "Verify Login",
                    html: codeMessage(
                        user.surname,
                        `Use this code to verify your login request. If you did not initiate this, contact support@potsec.edu.gh`,
                        smsCode
                    ),
                };

                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                await sgMail.send(msg);

                //send res to client
                res.status(200).json({
                    status: "success",
                    data: {
                        ac: token,
                        user,
                        expiry: new Date(Date.now() + 5 * 60 * 60 * 1000).getTime()
                    }
                });
            } else {
                throw new Error("Invalid user credentials");
            }
        }

    } catch (error) {
        res.status(500).json({
            status: "failed",
            responseCode: 401,
            error: error,
            message: error?.message
        });
    }

}

// RESEND SMS TOKEN
exports.resendEmailToken = async (req, res) => {
    try {
        const user = await Staff.findById(req.user.id).select('+verificationCode +verificationCodeExpiry')

        //send SMS code
        const smsCode = genDigits()
        user.verificationCode = smsCode
        user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000).getTime()
        await user.save()

        // send email
        const msg = tokenMessage(user, smsCode)
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send(msg);

        //res to client
        res.status(200).json({
            status: "success"
        });

    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

// VERIFY LOGIN
exports.verifyUserAccount = async (req, res) => {
    try {
        const user = await Staff.findOne({ email: req.user.email, verificationCode: req.body.code }).select('+verificationCode +verificationCodeExpiry')
        if (!user) throw Error('Invalid authentication token')
        if (user.verificationCodeExpiry < new Date().getTime()) throw Error('Two-Factor token has expired. Please resend token')

        // update user and save
        user.verificationCode = undefined;
        user.verificationCodeExpiry = undefined;
        user.isLoginVerified = true;
        await user.save()

        //send res to client
        res.status(200).json({
            status: "success",
            data: user
        });

    } catch (error) {
        res.status(401).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

// FORGOT PASSWORD
exports.staffForgetPassword = async (req, res) => {
    try {
        // find user using email
        const user = await Staff.findOne({ email: req.body.email }).select('+resetPasswordToken +resetPasswordExpires')
        if (!user) throw Error('User account does not exist')

        //generate token to email
        const activationToken = genDigits()
        user.resetPasswordToken = activationToken
        user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000).getTime()
        await user.save()

        // send email to user
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // const msg = {
        //     to: `${user.email}`, // Change to your recipient
        //     from: "Hive Afrika <noreply@hiveafrika.com>", // Change to your verified sender
        //     subject: "Hive Reset",
        //     html: registerMessage(
        //         "POTSEC",
        //         user.firstname,
        //         "To reset your password, use the code below to as the reset token. Please ignore this email if you did not register with POTSEC",
        //         activationToken
        //     ),
        // };
        // await sgMail.send(msg);
        await sendSMS(user.phone, `Verification Code - ${activationToken}`)

        //send res to client
        res.status(200).json({
            status: "success",
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

// RESET USER ACCOUNT PASSWORD
exports.resetStaffPassword = async (req, res) => {
    try {
        const { token, password, type, value } = req.body
        const user = type === 'email' ?
            await Staff.findOne({ email: value }).select('+password +resetPasswordToken +resetPasswordExpires')
            : await Staff.findOne({ phone: value }).select('+password +resetPasswordToken +resetPasswordExpires')

        if (!user) throw Error('No user account found')
        if (user.resetPasswordToken !== token) throw Error('Wrong reset token')
        if (user.resetPasswordExpires < new Date().getTime()) throw Error('Reset token has expired')

        // create password and access token
        const newPassword = await hashPassword(password);

        // update and save user account
        user.password = newPassword
        user.isLoginVerified = true
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        await user.save()

        //send email or sms
        if (type === 'sms') {
            await sendSMS(user.phone, `Hello ${user.firstname}. Your password reset was successful. If you did not initiate this, contact support@potsec.edu.gh`)
        } else {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: `${user.email}`, // Change to your recipient
                from: "POTSEC <noreply@potsec.edu.gh>", // Change to your verified sender
                subject: "Password Reset Successful",
                html: registerMessage(
                    "POTSEC",
                    user.firstname,
                    "Your password reset was successful. If you did not initiate this, contact support@potsec.edu.gh",
                ),
            };
            await sgMail.send(msg);
        }

        //send res to client
        res.status(200).json({
            status: 'success',
        })
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

// FETCH ALL STUDENTS
exports.getAllStudents = async (req, res) => {
    try {
        const allStudents = await Student.find({ role: 'student' }).populate({ path: 'enrollment.programme', select: 'name' }).sort('-createdAt')
        if (!allStudents) {
            throw Error('Sorry, no student data found')
        }

        //send res to client
        res.status(200).json({
            status: 'success',
            responseCode: 200,
            data: allStudents
        })
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.getAllApplicants = async (req, res) => {
    try {
        const applicants = await Student.find({ role: 'applicant' }).sort('-createdAt')
        if (!applicants) {
            throw Error('Sorry, no student data found')
        }

        //send res to client
        res.status(200).json({
            status: 'success',
            responseCode: 200,
            data: applicants
        })
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.getOneStudent = async (req, res) => {
    try {
        // console.log('Fetching one student data')
        const student = await Student.findById({ _id: req.params.id }).populate({
            path: 'enrollment.programme',
            populate: {
                path: 'courses',            // Populate the courses under the programme
                select: 'name code credit year semester' // Select relevant fields from Course
            }
        }).populate({
            path: 'enrollment.department', select: 'name'
        })
        if (!student) throw Error('Sorry, could not fetch student data. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            data: student
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.checkEmailAndPhone = async (req, res) => {
    try {
        console.log(req.body)
        const userExist = await Student.findOne({ email: req.body.email })
        if (userExist) throw Error("This applicant's email address already exist. Please check and try again")
        //send res to client
        res.status(200).json({
            status: "success",
            responseCode: 200
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            message: error.message
        });
    }
}

// CREATE NEW STUDENT
exports.createStudent = async (req, res) => {
    try {
        const userExist = await Student.findOne({ email: req.body.email })
        if (userExist) throw Error("This applicant's email address already exist. Please check and try again")
        const password = generatePassword()
        const newPassword = await hashPassword(password);
        const user = await Student.create({
            ...req.body,
            phone: { mobile: req.body.phone },
            password: newPassword,
        });

        if (!user) {
            throw Error("Something went wrong. Please try again");
        }
        await user.save();

        //send email to new register user
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: user.email,
            from: "POTSEC <noreply@potsec.edu.gh>",
            subject: "Welcome to POTSEC",
            html: registerMessage(
                `Dear ${user.surname}`,
                `Thank you for applying to POTSEC. To gain access to your portal, use the link and password code below to activate your account. Please ignore this email if you did not register with POTSEC`,
                password
            ),
        };
        await sgMail.send(msg);

        //send res to client
        res.status(200).json({
            status: "success",
            responseCode: 200,
            message: 'Payment successful, please check your email for detail to complete your application',
            data: user
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};

// UPDATE STUDENT PROFILE
exports.updateStudentProfile = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate({ _id: req.params.id }, req.body)
        if (!student) throw Error('Sorry, student profile update failed. Please try again');

        // update applicationStage //
        student.applicationStage = 3;
        student.applicationStatus = 'submitted';
        student.save();

        // send notification //
        if (student.role === 'applicant') {
            await Notify.create({
                user: student.id,
                title: 'Application Submitted',
                message: 'Thank you. Your application has been submitted and received.'
            });
        } else {
            await Notify.create({
                user: student.id,
                title: 'Profile Update',
                message: 'Student details updated successfully'
            });
        }

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200,
            data: student
        })

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// UPDATE STUDENT PHOTO
exports.updateStudentPhoto = async (req, res) => {
    try {
        // console.log('PHOTO ==> ', req.file)
        if (!req.file) {
            throw Error('Sorry, could not update profile picture')
        }
        //fetch user from database
        const user = await Student.findOne({ _id: req.params.id })
        user.photo = req.file.path;
        await user.save()

        // send res to client
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// UPDATE STUDENT DOCS
exports.updateStudentDocuments = async (req, res) => {

}

// UPDATE STUDENT PASSWORD
exports.updateStudentPassword = async (req, res) => {
    try {
        const { password } = req.body
        const student = await Student.findOne({ _id: req.params.id })
        if (!student) throw Error('Sorry, could not fetch student data')

        // generate and hash new password //
        const newPassword = await hashPassword(password);

        // update and save user account
        student.password = newPassword
        await student.save()


        //send email or sms
        await sendSMS(
            student.phone.mobile,
            `Hello ${student.surname}. Your new password - ${password}`
        )

        // send res to client
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// RESEND STUDENT ADMISSION LETTER
exports.sendAdmissionLetter = async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id }).populate({
            path: 'enrollment.programme',
            populate: {
                path: 'courses'
            }
        }).populate('enrollment.department')
        const admission = await AdmissionLetter.find()

        // send admission letter
        await sendAdmissionLetter(student, student.enrollment.programme, student.admissionDate, admission[0])

        // send res to client
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })


    } catch (error) {
        console.error('Error creating PDF:', error.message);
        res.status(500).json({
            status: 'failed',
            message: 'Failed to create and send the PDF.'
        });
    }
}

// FETCH ALL STAFF
exports.getAllStaff = async (req, res) => {
    try {
        const allStaff = await Staff.find().populate({ path: 'academics.department', select: 'name' }).sort('-createdAt')
        if (!allStaff) {
            throw Error('Sorry, no staff data found')
        }

        //send res to client
        res.status(200).json({
            status: 'success',
            responseCode: 200,
            data: allStaff
        })
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}


// CREATE NEW STAFF
exports.createStaff = async (req, res) => {
    try {
        //check if username and email has been taken
        const userExist = await Staff.findOne({ email: req.body.email })

        if (userExist) {
            //send res to client
            res.status(400).json({
                status: "failed",
                responseCode: 400,
                message: 'Staff account already exist with this email'
            });
        } else {
            const password = generatePassword()
            const staff_id = await generateStaffID()
            const newPassword = await hashPassword(password);
            const user = await Staff.create({
                ...req.body,
                academics: {
                    ...req.body.academics,
                    staffID: staff_id
                },
                password: newPassword,
            });

            if (!user) {
                throw Error("Something went wrong. Please try again");
            }
            await user.save();

            //send email to new register user
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: user.email,
                from: "POTSEC <noreply@hiveafrika.com>",
                subject: "Staff Registration",
                html: registerMessage(
                    `Dear ${user.surname}`,
                    "Welcome to POTSEC. To gain access to your portal, use the password code below to activate your account. Please ignore this email if you did not register with POTSEC",
                    password
                ),
            };
            await sgMail.send(msg);

            //send res to client
            res.status(200).json({
                status: "success",
                responseCode: 200,
                message: 'Staff account created successfully',
                data: user
            });

        }

    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};

// UPDATE STAFF PHOTO
exports.updateStaffPhoto = async (req, res) => {
    try {
        console.log('PHOTO ==> ', req.file)
        if (!req.file) {
            throw Error('Sorry, could not update profile picture')
        }
        //fetch user from database
        const user = await Staff.findOne({ index: req.params.id })
        user.photo = req.file.path;
        await user.save()

        // send res to client
        res.status(200).json({
            status: 'success',
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.updateStaffPassword = async (req, res) => {
    try {
        // console.log(req.body)
        const { password, oldPassword } = req.body
        const user = await Staff.findOne({ email: req.user.email }).select('+password')
        if (!user) throw Error('No user account found')

        const verified = await bcrypt.compare(oldPassword, user.password);
        // console.log('veerified ===>', verified)

        if (!verified) throw Error('Current password is not correct. Please try again')
        if (verified) {
            const newPassword = await hashPassword(password);
            // update and save user account
            user.password = newPassword
            await user.save();

            //notification//
            await Notify.create({
                user: user.id,
                title: 'Password Updated',
                message: 'Your password has been updated successfully.'
            });

            //send res to client
            res.status(200).json({
                status: "success"
            });
        }

    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

exports.bulkAddStaff = async (req, res) => {
    try {
        const { staff } = req.body; // `staff` should be an array of staff objects
        if (!Array.isArray(staff) || staff.length === 0) {
            throw new Error("No staff provided for bulk upload.");
        }

        // Map through the staff array and create each staff member
        const newStaff = await Promise.all(
            staff.map(async (member) => {
                const { surname, email, academics } = member;

                // Generate password, staff ID, and hash password
                const password = generatePassword();
                const staffID = await generateStaffID();
                const hashedPassword = await hashPassword(password);

                // Create a new staff record
                const newStaffMember = await Staff.create({
                    ...member,
                    password: hashedPassword,
                    academics: {
                        ...academics,
                        staffID,
                    },
                });

                // Send email notification
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msg = {
                    to: email,
                    from: "POTSEC <noreply@hiveafrika.com>",
                    subject: "Staff Registration",
                    html: registerMessage(
                        `Dear ${surname}`,
                        "Welcome to POTSEC. To gain access to your portal, use the password code below to activate your account.",
                        password
                    ),
                };
                await sgMail.send(msg);

                return newStaffMember._id; // Return the ID of the newly created staff
            })
        );

        // Send response to client
        res.status(200).json({
            status: "success",
            responseCode: 200,
            message: `${newStaff.length} staff members added successfully.`,
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};


exports.updateStaffProfile = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate({ _id: req.params.id }, req.body)
        if (!staff) throw Error('Sorry, staff profile update failed. Please try again');

        // send notification //
        await Notify.create({
            user: staff.id,
            title: 'Profile Update',
            message: 'Staff details updated successfully'
        });

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.deleteStaff = async (req, res) => {
    try {
        await Staff.findByIdAndDelete({ _id: req.params.id })
        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// GET ALL DEPARTMENT //
exports.getAllDepartments = async (req, res) => {
    try {
        const dept = await Department.find().populate('programmes')
        if (!dept) throw Error('Sorry, could not fetch departments. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            data: dept
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// CREATE DEPARTMENT //
exports.createDepartment = async (req, res) => {
    try {
        const dept = await Department.create({ name: req.body.name, head: req.body.head })
        if (!dept) throw Error('Sorry, department creation failed. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.bulkCreateDepartments = async (req, res) => {
    try {
        const { departments } = req.body; // `departments` should be an array of department objects
        if (!Array.isArray(departments) || departments.length === 0) {
            throw new Error("No departments provided for bulk upload.");
        }

        // Map through the departments array and create each department
        const newDepartments = await Promise.all(
            departments.map(async (department) => {
                const { name, head } = department;

                // Create a new department
                const newDepartment = await Department.create({
                    name,
                    head,
                });

                return newDepartment._id; // Return the ID of the newly created department
            })
        );

        // Send response to client
        res.status(200).json({
            status: "success",
            responseCode: 200,
            message: `${newDepartments.length} departments added successfully.`,
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};


// UPDATE DEPARTMENT //
exports.updateDepartment = async (req, res) => {
    try {
        const { name, head } = req.body
        const dept = await Department.findByIdAndUpdate({ _id: req.params.id }, { name, head })
        if (!dept) throw Error('Sorry, department update failed. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}
// DELETE DEPARTMENT //
exports.deleteDepartment = async (req, res) => {
    try {
        await Department.findByIdAndDelete({ _id: req.params.id })
        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}



// GET ALL PROGRAMME //
exports.getAllProgrammes = async (req, res) => {
    try {
        const prog = await Programmes.find().populate('department').sort({ createdAt: -1 })
        if (!prog) throw Error('Sorry, could not fetch programmes. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200,
            data: prog
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.getOneProgramme = async (req, res) => {
    try {
        // console.log('Fetching one programme')
        const prog = await Programmes.findById({ _id: req.params.id })
            .populate('department')
            .populate({ path: 'courses', select: 'name code semester year credit' })
            .select('-__v -_id')
        if (!prog) throw Error('Sorry, could not fetch programmes. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            data: prog
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// CREATE PRROGRAMME //
exports.createProgramme = async (req, res) => {
    try {
        const { name, department, duration, tuition, certification } = req.body
        const prog = await Programmes.create({ name, department, duration, tuition, certification })
        if (!prog) throw Error('Sorry, programme creation failed. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.bulkCreateProgrammes = async (req, res) => {
    try {
        const { programmes } = req.body; // `programmes` should be an array of programme objects
        if (!Array.isArray(programmes) || programmes.length === 0) {
            throw new Error("No programmes provided for bulk upload.");
        }

        // Map through the programmes array and create each programme
        const newProgrammes = await Promise.all(
            programmes.map(async (programme) => {
                const { name, department, duration, tuition } = programme;

                // Create a new programme
                const newProgramme = await Programmes.create({
                    name,
                    department,
                    duration,
                    tuition,
                    certification
                });

                return newProgramme._id; // Return the ID of the newly created programme
            })
        );

        // Send response to client
        res.status(200).json({
            status: "success",
            responseCode: 200,
            message: `${newProgrammes.length} programmes added successfully.`,
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};



// CREATE PRROGRAMME //
exports.updateProgramme = async (req, res) => {
    try {
        const { name, department, duration, tuition, certification } = req.body
        const prog = await Programmes.findByIdAndUpdate({ _id: req.params.id }, { name, department, duration, tuition, certification })
        if (!prog) throw Error('Sorry, programme update failed. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// DELETE PROGRAMME //
exports.deleteProgramme = async (req, res) => {
    try {
        await Programmes.findByIdAndDelete({ _id: req.params.id })
        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

// ADD COURSE TO PROGRAMME //
exports.addCourse = async (req, res) => {
    try {
        const { id, course } = req.body
        const { name, code, semester, credit, year } = course
        // create a new course
        const newCourse = await Course.create({ name, code, semester, year, credit, program: id })
        // find the program by id and add course id
        const prog = await Programmes.findByIdAndUpdate(id, { $push: { courses: newCourse.id } }, { new: true })
        if (!prog) throw Error('Sorry, adding course failed. Please try again');

        // send response to client //
        res.status(200).json({
            status: 'success'
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.bulkAddCourses = async (req, res) => {
    try {
        const { id, courses } = req.body; // `courses` should be an array of course objects
        if (!Array.isArray(courses) || courses.length === 0) {
            throw new Error("No courses provided for bulk upload.");
        }

        // Map through the courses array and create each course
        const newCourses = await Promise.all(
            courses.map(async (course) => {
                const { name, code, semester, credit, year } = course;

                // Create a new course and associate it with the program
                const newCourse = await Course.create({
                    name,
                    code,
                    semester,
                    year,
                    credit,
                    program: id,
                });

                return newCourse._id; // Return the ID of the newly created course
            })
        );

        // Update the program by adding all course IDs in one go
        const updatedProgram = await Programmes.findByIdAndUpdate(
            id,
            { $push: { courses: { $each: newCourses } } },
            { new: true }
        );

        if (!updatedProgram) {
            throw new Error("Sorry, adding courses failed. Please try again.");
        }

        // Send response to client
        res.status(200).json({
            status: "success",
            responseCode: 200,
            message: `${newCourses.length} courses added successfully.`,
            updatedProgram,
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};


exports.removeCourse = async (req, res) => {
    try {
        const { id, course } = req.body
        const prog = await Programmes.findByIdAndUpdate(id, { $pull: { courses: course.id } }, { new: true })
        if (!prog) throw Error('Sorry, deleting course failed. Please try again');

        // send response to client //
        res.status(200).json({
            status: 'success'
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete({ _id: req.params.id })

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.denyStudentAdmission = async (req, res) => {
    try {
        await Student.findByIdAndDelete({ _id: req.params.id })

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}


exports.admitStudent = async (req, res) => {
    try {
        const student = await Student.findById({ _id: req.params.id }).populate('enrollment.programme')
        if (!student) throw Error('Applicant does not exist. Please try again')

        // generate index no. and update role
        const programme = student.enrollment.programme
        const indexNo = await generateIndex();
        student.role = 'student';
        student.applicationStatus = 'admitted';
        student.applicationStage = 4;
        student.enrollment.index = indexNo;
        student.doa = getFormattedAdmissionDate(new Date());
        if (programme.duration.type === 'months') {
            student.doc = getFutureFormattedDate(programme.duration.number)
        }
        if (programme.duration.type === 'years') {
            student.doc = getFutureFormattedDate(0, programme.duration.number)
        }

        // send SMS to student no.
        const message = `Congratulations, ${student.surname}! You've been admitted to POTSEC. Welcome to the family! Check your email for details. Questions? Contact us at 0247142800`
        await sendSMS(student.phone.mobile, message);

        // send email
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: student.email,
            from: "POTSEC <noreply@potsec.edu.gh>",
            subject: "Admission Confirmation - POTSEC",
            html: welcomeMessage(student.surname, indexNo),
            attachments: req.file
                ? [
                    {
                        content: req.file.buffer.toString('base64'), // Encode file in Base64
                        filename: req.file.originalname,
                        type: req.file.mimetype,
                        disposition: 'attachment',
                    },
                ]
                : [],
        };
        await sgMail.send(msg);

        //notification//
        await Notify.create({
            user: student.id,
            title: 'Student Admission',
            message: 'A new student has been successfully admitted.'
        });

        await student.save();

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.resendAdmissionLetter = async (req, res) => {
    try {
        const student = await Student.findById({ _id: req.params.id }).populate('enrollment.programme')
        if (!student) throw Error('Applicant does not exist. Please try again')

        // send email
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: student.email,
            from: "POTSEC <noreply@potsec.edu.gh>",
            subject: "Admission Confirmation - POTSEC",
            html: welcomeMessage(student.surname, ''),
            attachments: req.file
                ? [
                    {
                        content: req.file.buffer.toString('base64'), // Encode file in Base64
                        filename: req.file.originalname,
                        type: req.file.mimetype,
                        disposition: 'attachment',
                    },
                ]
                : [],
        };
        await sgMail.send(msg);
        await student.save();

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200
        })
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}


// SEARCH CONTROLLERS //
exports.searchStaff = async (req, res) => {
    try {
        const { name, email } = req.query;
        let staffID = req.query.staffid

        // Build dynamic filter
        const filter = {};

        // Search by name (surname or othernames) - partial and case-insensitive
        if (name) {
            filter.$or = [
                { surname: { $regex: name, $options: 'i' } },
                { othernames: { $regex: name, $options: 'i' } }
            ];
        }

        // Search by staffID
        if (staffID) {
            filter['academics.staffID'] = staffID;
        }

        // Search by email (case-insensitive exact match)
        if (email) {
            filter.email = { $regex: `^${email}$`, $options: 'i' };
        }

        // Check if at least one filter was provided
        if (Object.keys(filter).length === 0) {
            return res.status(400).json({
                status: 'failed',
                message: 'Please provide at least one search filter: name, staffID, or email.',
            });
        }

        // Search staff with the applied filters
        const staff = await Staff.find(filter);


        // Return search results
        res.status(200).json({
            status: 'success',
            data: staff,
        });

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while searching for staff.',
            error: error.message,
        });
    }
};

exports.searchProgrammes = async (req, res) => {
    try {
        const { name, department } = req.query;

        // Build the dynamic filter
        const filter = {};

        // Search by name (case-insensitive partial match)
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        // Search by department ID
        if (department) {
            filter.department = department;
        }

        // Check if any filter was provided
        if (Object.keys(filter).length === 0) {
            return res.status(400).json({
                status: 'failed',
                message: 'Please provide at least one filter: name or department.',
            });
        }

        // Query the Programme collection with populated department details
        const programmes = await Programmes.find(filter).populate('department');

        // Send the result
        res.status(200).json({
            status: 'success',
            data: programmes,
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while searching for programmes.',
            error: error.message,
        });
    }
};

exports.searchDepartmentByName = async (req, res) => {
    try {
        const { name } = req.query;

        // Validate if the name parameter is provided
        if (!name) {
            return res.status(400).json({
                status: 'failed',
                message: 'Please provide a department name to search.',
            });
        }

        // Perform a case-insensitive search for the department name
        const departments = await Department.find({
            name: { $regex: name, $options: 'i' }
        }).populate('programmes');

        // Send successful response
        res.status(200).json({
            status: 'success',
            data: departments,
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while searching for departments.',
            error: error.message,
        });
    }
};

exports.searchStudents = async (req, res) => {
    try {
        const { name, index, status } = req.query;

        // Check if at least one filter is provided
        if (!name && !index && !status) {
            return res.status(400).json({
                status: 'failed',
                message: 'Please provide either a student name or index number to search.',
            });
        }

        // Build dynamic filter
        const filter = {};

        // Search by name (surname or othernames) - case-insensitive partial match
        if (name) {
            filter.$or = [
                { surname: { $regex: name, $options: 'i' } },
                { othernames: { $regex: name, $options: 'i' } }
            ];
        }

        // Search by index number
        if (index) {
            filter['enrollment.index'] = index;
        }
        if (status) {
            filter['applicationStatus'] = status;
        }

        // Find matching students
        const students = await Student.find(filter);

        // Return matching students
        res.status(200).json({
            status: 'success',
            data: students,
        });

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while searching for students.',
            error: error.message,
        });
    }
};

exports.getCounts = async (req, res) => {
    try {
        // Perform parallel counting for efficiency
        const [studentCount, staffCount, programmeCount, departmentCount] = await Promise.all([
            Students.countDocuments({ role: 'student' }), // Count only students
            Staff.countDocuments({ role: 'staff' }),     // Count only staff
            Programmes.countDocuments(),                 // Count all programmes
            Department.countDocuments()                  // Count all departments
        ]);

        // Return the counts in the response
        res.status(200).json({
            status: 'success',
            data: {
                students: studentCount,
                staff: staffCount,
                programmes: programmeCount,
                departments: departmentCount,
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while fetching the counts.',
            error: error.message,
        });
    }
};

exports.resetStaffPasswordByAdmin = async (req, res) => {
    try {
        const { id } = req.params;              // Staff ID from URL params
        const { newPassword } = req.body;       // New password from request body

        // Validate if newPassword is provided
        if (!newPassword) {
            return res.status(400).json({
                status: 'failed',
                message: 'Please provide a new password.',
            });
        }

        // Find the staff by ID
        const staff = await Staff.findById(id);
        if (!staff) {
            return res.status(404).json({
                status: 'failed',
                message: 'Staff member not found.',
            });
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword)

        // Update the staff password
        staff.password = hashedPassword;
        await staff.save();

        // Send response
        res.status(200).json({
            status: 'success',
            message: 'Password reset successfully.',
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while resetting the password.',
            error: error.message,
        });
    }
};

exports.createAdmissionLetter = async (req, res) => {
    try {
        const { startDate, endDate, bank, accountNo, accountName, utilities } = req.body;

        // Validate required fields
        if (!startDate || !endDate || !bank || !accountNo || !accountName || !utilities) {
            return res.status(400).json({
                status: 'failed',
                message: 'All fields (startDate, endDate, bank, accountNo, accountName, utilities) are required.',
            });
        }

        // Create a new admission letter
        const newAdmissionLetter = await AdmissionLetter.create({
            startDate,
            endDate,
            bank,
            accountNo,
            accountName,
            utilities,
        });

        // Send success response
        res.status(201).json({
            status: 'success',
            message: 'Admission letter created successfully.',
            data: newAdmissionLetter,
        });

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while creating the admission letter.',
            error: error.message,
        });
    }
};

exports.getAdmissionLetter = async (req, res) => {
    try {
        const admission = await AdmissionLetter.find()

        res.status(200).json({
            status: "success",
            responseCode: 200,
            data: admission[0]
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

exports.updateAdmissionLetter = async (req, res) => {
    try {
        const { startDate, endDate, bank, accountNo, accountName, utilities } = req.body;

        // Validate input: Ensure all fields are provided
        if (!startDate || !endDate || !bank || !accountNo || !accountName || !utilities) {
            return res.status(400).json({
                status: 'failed',
                message: 'All fields (startDate, endDate, bank, accountNo, accountName, utilities) are required.',
            });
        }

        // Fully update all fields of the admission letter
        const updatedAdmissionLetter = await AdmissionLetter.findByIdAndUpdate(
            {},
            {
                startDate,
                endDate,
                bank,
                accountNo,
                accountName,
                utilities,
            },
            { new: true }  // Overwrites all fields
        );

        // Return success response
        res.status(200).json({
            status: 'success',
            message: 'Admission letter updated successfully.',
            data: updatedAdmissionLetter,
        });

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'An error occurred while updating the admission letter.',
            error: error.message,
        });
    }
};



//  GRADING 
exports.getAllResultsFiles = async (req, res) => {
    try {
        const ups = await ResultsUpload.find().populate({
            path: 'course',
            select: 'name year semester',
            populate: { path: 'program', select: 'name' }
        }).populate({ path: 'uploadBy', select: 'surname othernames' }).sort({ createdAt: -1 })
        if (!ups) throw Error('Sorry, could not fetch results uploads. Please try again');

        // send audit //

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200,
            data: ups
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}

exports.bulkGradesUpload = async (req, res) => {
    try {
        const { grades } = req.body; // `grades` should be an array of department objects
        if (!Array.isArray(grades) || grades.length === 0) {
            throw new Error("No grades provided for bulk upload.");
        }

        // Map through the departments array and create each department
        const newGrades = await Promise.all(
            grades.map(async (gradeRow) => {
                const { student, course } = gradeRow;

                // find student and course //
                const studentData = await Student.findOne({ "enrollment.index": student });
                const courseData = await Course.findOne({ code: course });

                // Create a new department
                const newGrade = await GradeModel.create({
                    ...gradeRow,
                    student: studentData._id,
                    course: courseData._id
                });

                return newGrade._id; // Return the ID of the newly created department
            })
        );

        // Send response to client
        res.status(200).json({
            status: "success",
            responseCode: 200,
            message: `${newGrades.length} grades added successfully.`,
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};

// UPLOAD RESULTS FILE
exports.uploadGradesFile = async (req, res) => {
    try {
        // console.log('file ==> ', req.file)
        const { course_code } = req.body
        if (!req.file) {
            throw Error('Sorry, could not upload grades file')
        }
        //fetch user from database
        const course = await Course.findOne({ code: course_code })
        if (!course) throw Error('Sorry, course code is invalid or does not exist')

        // save a result-file
        await ResultsUpload.create({
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            course: course.id,
            uploadBy: req.user._id
        })

        // send res to client
        res.status(200).json({
            status: 'success',
        })

    } catch (error) {
        res.status(404).json({
            status: 'failed',
            error: error,
            message: error.message
        })
    }
}