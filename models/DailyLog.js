const mongoose = require('mongoose')

const foodItemSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  fiber: Number,
  amount: Number,
  unit: String,
}, { _id: false })

const workoutSchema = new mongoose.Schema({
  planId: String,
  planName: String,
  duration: Number,
  caloriesBurned: Number,
  exercisesCompleted: Number,
  totalExercises: Number,
  completedAt: String,
}, { _id: false })

const dailyLogSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  date: { type: String, required: true },
  meals: {
    breakfast: { type: [foodItemSchema], default: [] },
    lunch:     { type: [foodItemSchema], default: [] },
    dinner:    { type: [foodItemSchema], default: [] },
    snacks:    { type: [foodItemSchema], default: [] },
  },
  totalCaloriesEaten: { type: Number, default: 0 },
  waterGlasses: { type: Number, default: 0 },
  workout: { type: workoutSchema, default: null },
  workoutDone: { type: Boolean, default: false },
  habits: { type: [String], default: [] },
  disciplineScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

dailyLogSchema.index({ uid: 1, date: 1 }, { unique: true })

dailyLogSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

dailyLogSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() })
  next()
})

module.exports = mongoose.model('DailyLog', dailyLogSchema)
