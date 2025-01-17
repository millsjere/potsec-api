const mongoose = require('mongoose')

const resultFilesSchema = new mongoose.Schema({
  name: { type: String },
  fileUrl: {type: String },
  programme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Programmes', // Reference to the Programmes model
  },  
  year: { type: Number },
  trimester: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

const ResultsUpload = mongoose.model('ResultsUpload', resultFilesSchema)
module.exports = ResultsUpload