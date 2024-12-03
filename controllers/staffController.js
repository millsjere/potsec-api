
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const User = require('../models/staffModel')
const Student = require('../models/studentModel')
const { registerMessage, genericMessage, codeMessage } = require('../mailer/templates');
const sgMail = require('@sendgrid/mail')
const { sendSMS } = require('../sms/ghsms');
const Department = require('../models/departmentModel');
const Programmes = require('../models/programmeModel');
const FormPrice = require('../models/priceModel');


const sampleData = {
    surname: 'Mills',
    othernames: 'Jeremiah',
    email: 'jmills@potsec.edu.gh',
    password: 'test12345',
    phone: '0557228597',
    gender: 'Male',
    programme: 'Computer Science',
    department: 'College of Engineering',
    campus: 'Kumasi'
}

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
    const nextIndex = await Student.countDocuments() + 1;
    const paddedIndex = nextIndex.toString().padStart(4, '0');
    return `PTC${year}${month}${paddedIndex}`;
}

const tokenMessage = (user, code) => {
    const msg = {
        to: `${user.email}`, // Change to your recipient
        from: "POTSEC <noreply@hiveafrika.com>", // Change to your verified sender
        subject: "Verify Login",
        html: codeMessage(
            user.surname,
            `Use this code to verify your login request. If you did not initiate this, contact support@apps.potsec.edu.gh`,
            code
        ),
    };
    return msg
}

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


// USER SIGNUP
exports.createAccount = async (req, res) => {
    try {
        //chech if username and email has been taken
        const { othernames, surname, email, phone, gender, programme, password, department, campus } = sampleData;
        const userExist = await User.findOne({ email })
        if (userExist) {
            //send res to client
            res.status(400).json({
                status: "failed",
                responseCode: 400,
                message: 'User already exist with this email'
            });
        } else {
            const newPassword = await hashPassword(password);
            const user = await User.create({
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
        const user = await User.findOne({ email }).select('+password +verificationCode +verificationCodeExpiry')
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
                    from: "POTSEC <noreply@hiveafrika.com>", // Change to your verified sender
                    subject: "Verify Login",
                    html: codeMessage(
                        user.surname,
                        `Use this code to verify your login request. If you did not initiate this, contact support@apps.potsec.edu.gh`,
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
        res.status(401).json({
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
        const user = await User.findById(req.user.id).select('+verificationCode +verificationCodeExpiry')

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
        const user = await User.findOne({ email: req.user.email, verificationCode: req.body.code }).select('+verificationCode +verificationCodeExpiry')
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
        const user = await User.findOne({ email: req.body.email }).select('+resetPasswordToken +resetPasswordExpires')
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
            await User.findOne({ email: value }).select('+password +resetPasswordToken +resetPasswordExpires')
            : await User.findOne({ phone: value }).select('+password +resetPasswordToken +resetPasswordExpires')

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
            await sendSMS(user.phone, `Hello ${user.firstname}. Your password reset was successful. If you did not initiate this, contact support@hiveafrika.com`)
        } else {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: `${user.email}`, // Change to your recipient
                from: "POTSEC <noreply@hiveafrika.com>", // Change to your verified sender
                subject: "Password Reset Successful",
                html: genericMessage(
                    "POTSEC",
                    user.firstname,
                    "Your password reset was successful. If you did not initiate this, contact support@apps.potsec.edu.gh",
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
        const allStudents = await Student.find().sort('-createdAt')
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
exports.getOneStudent = async (req, res) => {
    try {
        // console.log('Fetching one student data')
        const student = await Student.findById({ _id: req.params.id }).select('-__v')
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
        // console.log(req.body)
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
            from: "POTSEC <noreply@hiveafrika.com>",
            subject: "Welcome to POTSEC",
            html: registerMessage(
                `Dear ${user.surname}`,
                `Thank you for applying to POTSEC. To gain access to your portal, use the link and password code below to activate your account. 
                    Please ignore this email if you did not register with POTSEC`,
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
        student.applicationStage = 2;
        student.save();

        // send response to client //
        res.status(200).json({
            status: 'success',
            responseCode: 200,
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

        console.log('Level 1')

        //send email or sms
        await sendSMS(
            student.phone.mobile,
            `Hello ${student.surname}. Your new password - ${password}`
        )

        console.log('Level 2')

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

// FETCH ALL STAFF
exports.getAllStaff = async (req, res) => {
    try {
        const allStaff = await User.find().sort('-createdAt')
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
        const userExist = await User.findOne({ email: req.body.email })

        if (userExist) {
            //send res to client
            res.status(400).json({
                status: "failed",
                responseCode: 400,
                message: 'Staff account already exist with this email'
            });
        } else {
            const password = generatePassword()
            const newPassword = await hashPassword(password);
            const user = await User.create({
                ...req.body,
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
        const user = await User.findOne({ index: req.params.id })
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
        const prog = await Programmes.findById({ _id: req.params.id }).populate('department').select('-__v -_id')
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
        const { name, department, duration } = req.body
        const prog = await Programmes.create({ name, department, duration })
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

// CREATE PRROGRAMME //
exports.updateProgramme = async (req, res) => {
    try {
        const { id, name, department, duration } = req.body
        const prog = await Programmes.findByIdAndUpdate({ _id: id }, { name, department, duration })
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
        const prog = await Programmes.findByIdAndUpdate(id, { $push: { courses: course } }, { new: true })
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
exports.removeCourse = async (req, res) => {
    try {
        const { id, course } = req.body
        const prog = await Programmes.findByIdAndUpdate(id, { $pull: { courses: course } }, { new: true })
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