const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
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
    dob: String,
    photo: String,
    documents: Array,
    gender: String,
    age: Number,
    educationalLevel: String,
    address: {
        residence: { type: String },
        town: { type: String },
        district: { type: String },
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
    enrollment: {
        index: { type: String },
        type: { type: String },
        month: { type: String },
        year: { type: String },
        duration: { type: String },
        programme: { type: String },
        department: { type: String },
        certification: { type: String },
        certificationLevel: { type: String },
        modeofTuition: { type: String },
        session: { type: String },
    },
    payment: {
        type: { type: String },
        reference: { type: String },
        transactionID: { type: String }
    },
    employment: {
        isEmployed: { type: String },
        currentJob: { type: String },
        afterCompletion: { type: String },
    },
    health: {
        anyCondition: String,
        details: String
    },
    guardian: {
        name: String,
        phone: String,
        relationship: String,
    },
    sponsor: {
        name: String,
        phone: String,
        relationship: String,
    },
    emergency: {
        name: String,
        phone: String,
    },
    campus: String,
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