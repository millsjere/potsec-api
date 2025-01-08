const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Students', // Reference to the Student model
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course', // Reference to the Course model
        required: true,
    },
    grade: {
        type: String, 
        required: true,
        enum: ['A', 'B+', 'B', 'C+', 'C', 'D', 'E', 'F'], // Restrict grades to these values
    },
    score: {
        type: Double,
        required: false,
        min: 0,
        max: 100, // Assuming marks are out of 100
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Grade', GradeSchema);
