const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  head: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

departmentSchema.virtual('programmes', {
  ref: 'Programmes',
  localField: '_id',
  foreignField: 'department'
});

const Department = mongoose.model('Department', departmentSchema)
module.exports = Department