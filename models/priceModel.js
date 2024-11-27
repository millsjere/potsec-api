const mongoose = require('mongoose')

const priceSchema = new mongoose.Schema({
  amount: { type: Number, default: 120 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})


const FormPrice = mongoose.model('FormPrice', priceSchema)
module.exports = FormPrice