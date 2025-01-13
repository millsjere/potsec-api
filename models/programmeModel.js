const mongoose = require('mongoose')

const programmeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.ObjectId,
        ref: 'Department'
    },
    duration: {
        type: { type: String, lowercase: true },
        number: { type: Number }
    },
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course', // Reference to the Course model
        },
    ],
    tuition: {
        currency: { type: String, default: 'GHS' },
        amount: { type: Number, default: 0 },
        words: String
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


const Programmes = mongoose.model('Programmes', programmeSchema)
module.exports = Programmes