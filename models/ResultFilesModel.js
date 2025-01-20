const mongoose = require('mongoose')

const resultFilesSchema = new mongoose.Schema({
  fileName: { type: String },
  fileUrl: { type: String },
  uploadBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff', // Reference to the Courses model
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Reference to the Courses model
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

const ResultsUpload = mongoose.model('ResultsUpload', resultFilesSchema)
module.exports = ResultsUpload