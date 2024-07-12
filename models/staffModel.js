const mongoose = require('mongoose')


const staffSchema = new mongoose.Schema({
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
        mobile: { type: String },
        whatsapp: { type: String }
    },
    photo: { type: String },
    gender: { type: String },
    address: {
        residence: { type: String },
        region: { type: String }
    },
    nationalID: {
        type: { type: String },
        number: { type: String }
    },
    language: {
        spoken: String,
        written: String
    },
    academics: {
        department: { type: String },
        staffID: { type: String },
        staffEmail: { type: String },
        programme: { type: String },
        campus: { type: String }
    },
    role: { type: String, default: 'staff' },
    isLoginVerified: { type: Boolean, default: false },
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