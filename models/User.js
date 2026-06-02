const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, default: '' },
  name: { type: String, default: '' },
  gender: { type: String, default: '' },
  age: { type: mongoose.Schema.Types.Mixed, default: '' },
  goal: { type: String, default: '' },
  currentWeight: { type: Number, default: 0 },
  startWeight: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  targetWeight: { type: Number, default: 0 },
  activityLevel: { type: String, default: '' },
  dietType: { type: String, default: '' },
  focusAreas: { type: [String], default: [] },
  availableTime: { type: String, default: '' },
  fitnessLevel: { type: String, default: '' },
  coachPersonality: { type: String, default: '' },
  lifestyle: { type: [String], default: [] },
  bodyType: { type: String, default: '' },
  equipment: { type: [String], default: [] },
  injuries: { type: [String], default: [] },
  language: { type: String, default: 'en' },
  bmr: { type: Number, default: 0 },
  dailyCalories: { type: Number, default: 0 },
  proteinTarget: { type: Number, default: 0 },
  carbsTarget: { type: Number, default: 0 },
  waterTarget: { type: Number, default: 8 },
  workoutLevel: { type: String, default: 'beginner' },
  workoutsPerWeek: { type: Number, default: 0 },
  streakCount: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  totalWorkouts: { type: Number, default: 0 },
  lastWorkoutDate: { type: String, default: null },
  disciplineScore: { type: Number, default: 0 },
  planGeneratedAt: { type: String, default: null },
  currentPlan: { type: mongoose.Schema.Types.Mixed, default: null },
  pushToken: { type: String, default: null },
  brainScores: { type: mongoose.Schema.Types.Mixed, default: { speed: 0, focus: 0, memory: 0, logic: 0, calm: 0 } },
  mindStreak: { type: Number, default: 0 },
  mindStreakLastDate: { type: String, default: null },
  gameScores: { type: mongoose.Schema.Types.Mixed, default: {} },
  gratitudeEntries: { type: [mongoose.Schema.Types.Mixed], default: [] },
  lastWeeklyReview: { type: String, default: null },
  plan: { type: String, default: 'free', enum: ['free', 'pro'] },
  planExpiresAt: { type: Date, default: null },
  dietUsage: {
    type: mongoose.Schema.Types.Mixed,
    default: { searches: 0, suggestions: 0, plans: 0, lastReset: null, lastPlanReset: null }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

userSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() })
  next()
})

module.exports = mongoose.model('User', userSchema)
