const mongoose = require('mongoose')

const weightLogSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  date: { type: String, required: true },
  weight: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  loggedAt: { type: Date, default: Date.now },
})

weightLogSchema.index({ uid: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('WeightLog', weightLogSchema)
