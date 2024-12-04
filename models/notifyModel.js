const mongoose = require('mongoose')

const notifySchema = new mongoose.Schema({
  user: mongoose.Types.ObjectId,
  message: { type: String },
  title: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})


const Notify = mongoose.model('Notify', notifySchema)
module.exports = Notify