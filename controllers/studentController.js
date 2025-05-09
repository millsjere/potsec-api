const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const User = require('../models/studentModel')
const { registerMessage, genericMessage, codeMessage } = require('../mailer/templates');
const sgMail = require('@sendgrid/mail')
const { sendSMS } = require('../sms/ghsms');
const Notify = require('../models/notifyModel');


const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
}

const genDigits = () => {
    const code = Math.floor(100000 + Math.random() * 900000)
    return code
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


// USER FORGOT PASSWORD
exports.forgetUserPassword = async (req, res) => {
    try {
        const { type } = req.body;
        if (type === 'email') {
            // find user using email
            const user = await User.findOne({ email: req.body.email }).select('+resetPasswordToken +resetPasswordExpires')
            if (!user) throw Error('User account does not exist')

            //generate token to email
            const activationToken = genDigits()
            user.resetPasswordToken = activationToken
            user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000).getTime()
            await user.save()

            // send email to user
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = tokenMessage(user, activationToken)
            // const msg = {
            //     to: `${user.email}`, // Change to your recipient
            //     from: "POTSEC <noreply@potsec.edu.gh>", // Change to your verified sender
            //     subject: "Forgot Password Reset",
            //     html: registerMessage(
            //         "POTSEC",
            //         user.firstname,
            //         "To reset your password, use the code below to as the reset token. Please ignore this email if you did not register with POTSEC",
            //         activationToken
            //     ),
            // };

            await sgMail.send(msg);

            //send res to client
            res.status(200).json({
                status: "success",
            });
        }
        if (type === 'sms') {

            // find user using phone
            const user = await User.findOne({ phone: req.body.sms }).select('+resetPasswordToken +resetPasswordExpires')
            if (!user) throw Error('User account does not exist')

            //send SMS code
            const smsCode = genDigits()
            user.resetPasswordToken = smsCode
            user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000).getTime()
            await user.save()

            await sendSMS(user.phone, `Verification Code - ${smsCode}`)

            //send res to client
            res.status(200).json({
                status: "success",
            });

        }
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

// RESET USER ACCOUNT PASSWORD
exports.resetUserPassword = async (req, res) => {
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
        let accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "5h",
        });

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
                html: registerMessage(
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
            data: {
                ac: accessToken,
                user,
                expiry: new Date(Date.now() + 5 * 60 * 60 * 1000).getTime()
            }
        })
    } catch (error) {
        res.status(400).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

// RESEND VERIFICATION EMAIL
exports.resendEmailVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+verificationCode +verificationCodeExpiry')
        if (!user) throw Error("User account not found");

        const activationToken = genDigits();
        user.verificationCode = activationToken
        user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000).getTime()
        await user.save()

        // send email
        const msg = tokenMessage(user, activationToken)
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send(msg);

        // send res to client
        res.status(200).json({
            status: "success",
        });

    } catch (error) {
        res.status(401).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};

// LOGIN USER
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // find user using email
        const user = await User.findOne({ email }).select("+password +verificationCode +verificationCodeExpiry");
        if (!user) {
            throw Error("Invalid user credentials");
        }
        // if (!user.isEmailVerified) {
        //     throw Error("Email is not verified. Please check your email");
        // }

        // verify password
        const verified = bcrypt.compare(password, user.password);
        if (verified) {
            // sign token
            let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "5h",
            });

            // generate code
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
    } catch (error) {
        res.status(401).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
};

// SMS VERIFY //
exports.verifyUserAccount = async (req, res) => {
    try {
        const user = await User.findOne({ verificationCode: req.body.code }).select('+verificationCode +verificationCodeExpiry')
        if (!user) throw Error('Invalid authentication token')
        if (user.verificationCodeExpiry < new Date().getTime()) throw Error('Two-Factor token has expired. Please resend a new token')

        user.verificationCode = undefined;
        user.verificationCodeExpiry = undefined;
        user.isLoginVerified = true;
        await user.save()

        //res to client
        res.status(200).json({
            status: "success",
            data: user,
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}

// Change user password //
exports.changeUserPassword = async (req, res) => {
    try {
        // console.log(req.body)
        const { password, oldPassword } = req.body
        const user = await User.findOne({ email: req.user.email }).select('+password')
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
                user: student.id,
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


// NOTIFICATIONS //
exports.getAllNotifications = async (req, res) => {
    try {
        const notify = await Notify.find({ user: req.user.id });

        //send res to client
        res.status(200).json({
            status: "success",
            data: notify
        });
    } catch (err) {
        res.status(500).json({
            status: "failed",
            error: err,
            message: err.message,
        });
    }
}



// LOGOUT USER
exports.logout = async (req, res) => {
    try {
        res.clearCookie("uid_jwt");

        res.status(200).json({
            status: "success",
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error,
            message: error.message,
        });
    }
}