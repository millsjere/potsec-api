const mongoose = require('mongoose')

const applicationFormSchema = new mongoose.Schema({
  month: { type: String, default: 'January' },
  year: { type: String, default: '2025' },
  amount: { type: Number, default: 120 },
  type: { type: String, default: 'Local' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})


const FormPrice = mongoose.model('FormPrice', applicationFormSchema)
module.exports = FormPrice