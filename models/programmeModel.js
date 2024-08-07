const mongoose = require('mongoose')

const programmeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    department: { type: mongoose.ObjectId, ref: 'Department' },
    duration: {
        type: { type: String, lowercase: true },
        number: { type: Number }
    },
    courses: [{ type: Object }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


const Programmes = mongoose.model('Programmes', programmeSchema)
module.exports = Programmes