const mongoose = require('mongoose')

const programmeSchema = new mongoose.Schema({
        name: { type: String, required: true },
        department: { type: String },
        duration: { type: Number },
        courses: { type: Object }
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


const Programme = mongoose.model('Programme', programmeSchema)
module.exports = Programme