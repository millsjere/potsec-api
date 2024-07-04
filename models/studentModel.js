const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
    indexNumber: {
        type: String,
        required: true
    },
    othernames: {
        type: String,
        required: [true, 'Please provide a other names']
    },
    surname: {
        type: String,
        required: [true, 'Please provide a surname']
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: [true, 'Please provide a valid email']
    },
    password: {
        type: String,
        select: false
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    photo: String,
    gender: {
        type: String,
    },
    address: {
        type: String,
    },
    level: {
        type: String,
    },
    programme: String,
    department: String,
    campus: String,
    batch: {
        from: String,
        to: String
    },
    verificationCode: { type: String, select: false },
    verificationCodeExpiry: { type: Date, select: false },
    isFirstTime: { type: Boolean, default: true },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    // isLoginVerified: { type: Boolean, default: false },
    // isEmailVerified: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

//SENDBACK THE USER OBJECT TO THE CLIENT WITHOUT THE USER PASSWORD
studentSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
}

studentSchema.virtual('fullname').get(function () {
    const fullname = this.surname + " " + this.othernames
    return fullname
})

// DOCUMENT MIDDLEWARE //
studentSchema.pre("save", function (next) {
    this.othernames =
        this.othernames[0].toUpperCase() +
        this.othernames.substring(1).toLowerCase();

    this.surname =
        this.surname[0].toUpperCase() +
        this.surname.substring(1).toLowerCase()

    next();
});

const Students = mongoose.model('Students', studentSchema)
module.exports = Students