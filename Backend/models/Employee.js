const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  role: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  joinedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) }
}, { timestamps: true })

employeeSchema.virtual('id').get(function () { return this._id.toString() })
employeeSchema.set('toJSON', {
  virtuals: true,
  transform: (_, result) => { delete result._id; delete result.__v }
})

module.exports = mongoose.model('Employee', employeeSchema)
