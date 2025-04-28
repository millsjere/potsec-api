const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    trimester: {
        type: String, // "Trimester 1", "Trimester 2", etc.
        required: true,
    },
    year: {
        type: Number, // The year of the program, e.g., 1 for Year 1
        required: true,
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Programmes',
        required: true, // Link to the Program model
    },
    credit: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course
