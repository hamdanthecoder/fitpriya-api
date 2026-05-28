const mongoose = require('mongoose')

const workoutHistorySchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  date: { type: String, required: true },
  _firestoreId: { type: String, default: null },
  planId: { type: String, default: null },
  planName: { type: String, default: null },
  duration: { type: Number, default: 0 },
  caloriesBurned: { type: Number, default: 0 },
  exercisesCompleted: { type: Number, default: 0 },
  totalExercises: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
})

workoutHistorySchema.index({ uid: 1, date: -1 })

module.exports = mongoose.model('WorkoutHistory', workoutHistorySchema)
