const mongoose = require('mongoose')


const staffSchema = new mongoose.Schema({
    staffId: String,
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
    photo: { type: String },
    gender: { type: String },
    address: { type: String },
    department: { type: String },
    programme: { type: String },
    campus: { type: String },
    isLoginVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeExpiry: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

//SENDBACK THE USER OBJECT TO THE CLIENT WITHOUT THE USER PASSWORD
staffSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
}

staffSchema.virtual('fullname').get(function () {
    const fullname = this.surname + " " + this.othernames
    return fullname
})

// DOCUMENT MIDDLEWARE //
staffSchema.pre("save", function (next) {
    this.othernames =
        this.othernames[0].toUpperCase() +
        this.othernames.substring(1).toLowerCase();

    this.surname =
        this.surname[0].toUpperCase() +
        this.surname.substring(1).toLowerCase()

    next();
});

const Staff = mongoose.model('Staff', staffSchema)
module.exports = Staff