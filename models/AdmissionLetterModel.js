const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true
    },
    bank: {
        type: String,
        required: true,
    },
    accountNo: {
        type: String,
        required: true,
    },
    accountName: {
        type: String,
        required: true,
    },
    utilities: {
        type: String,
        required: true
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const AdmissionLetter = mongoose.model('AdmissionLetter', admissionSchema);
module.exports = AdmissionLetter
