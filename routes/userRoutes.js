const express = require('express')
const router = express.Router()
const admin = require('firebase-admin')
const verifyToken = require('../middleware/auth')
const User = require('../models/User')
const DailyLog = require('../models/DailyLog')
const WeightLog = require('../models/WeightLog')
const WorkoutHistory = require('../models/WorkoutHistory')
const { getPersonalisedHabits } = require('../data/habits')

// All routes require auth
router.use(verifyToken)

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isExpiredPro(user) {
  return user?.plan === 'pro' && user.planExpiresAt && new Date(user.planExpiresAt) < new Date()
}

async function normalizeExpiredPlan(user) {
  if (!isExpiredPro(user)) return user
  const updated = await User.findOneAndUpdate(
    { uid: user.uid },
    { $set: { plan: 'free', planExpiresAt: null } },
    { new: true }
  )
  const fallback = typeof user.toObject === 'function' ? user.toObject() : user
  return updated || { ...fallback, plan: 'free', planExpiresAt: null }
}

function calcStreak(lastDate, current) {
  if (!lastDate) return 1
  const today = todayStr()
  if (lastDate === today) return current
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  return lastDate === yStr ? (current || 0) + 1 : 1
}

// ─── USER PROFILE ───────────────────────────────────────────────────────────

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    let user = await User.findOne({ uid: req.uid })
    if (!user) return res.json({ success: true, data: null })
    user = await normalizeExpiredPlan(user)
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/users/profile  (create or update — upsert)
router.post('/profile', async (req, res) => {
  try {
    const existing = await User.findOne({ uid: req.uid })
    let user
    if (existing) {
      // Preserve activity counters on update
      const { streakCount, bestStreak, totalWorkouts, lastWorkoutDate, disciplineScore, ...safeUpdates } = req.body
      user = await User.findOneAndUpdate(
        { uid: req.uid },
        { $set: safeUpdates },
        { new: true }
      )
    } else {
      user = new User({ uid: req.uid, email: req.email, ...req.body })
      await user.save()
    }
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/users/profile  (partial update, no counter protection)
router.patch('/profile', async (req, res) => {
  try {
    const updates = { ...req.body }
    if (updates.notifications && typeof updates.notifications === 'object') {
      const existing = await User.findOne({ uid: req.uid }).select('notifications').lean()
      updates.notifications = {
        ...(existing?.notifications || {}),
        ...updates.notifications,
        mealTimes: {
          ...(existing?.notifications?.mealTimes || {}),
          ...(updates.notifications.mealTimes || {}),
        },
      }
    }
    const user = await User.findOneAndUpdate(
      { uid: req.uid },
      { $set: updates },
      { new: true, upsert: true }
    )
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/users/plan  (save generated plan)
router.post('/plan', async (req, res) => {
  try {
    const plan = req.body
    // Safety clamp on calorie values
    let dailyCal = Number(plan.dailyCalories ?? plan.targets?.calories) || 1800;
    if (dailyCal < 1000 || dailyCal > 5000) dailyCal = 1800;
    
    const updates = {
      currentPlan:      plan,
      dailyCalories:    dailyCal,
      proteinTarget:    plan.macros?.protein,
      carbsTarget:      plan.macros?.carbs,
      waterTarget:      plan.targets?.water,
      workoutsPerWeek:  plan.targets?.workoutsPerWeek,
      planGeneratedAt:  plan.generatedAt ?? new Date().toISOString(),
    }
    const user = await User.findOneAndUpdate(
      { uid: req.uid },
      { $set: updates },
      { new: true, upsert: true }
    )
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── DAILY LOG ───────────────────────────────────────────────────────────────

function emptyLog(uid, date) {
  return {
    uid,
    date,
    meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    totalCaloriesEaten: 0,
    waterGlasses: 0,
    workout: null,
    workoutDone: false,
    habits: [],
    disciplineScore: 0,
  }
}

function macroTotals(meals = {}) {
  return Object.values(meals).reduce((acc, items) => {
    ;(items || []).forEach(item => {
      acc.calories += Number(item.calories) || 0
      acc.protein += Number(item.protein) || 0
    })
    return acc
  }, { calories: 0, protein: 0 })
}

function getScoreTargets(user = {}) {
  return {
    calories: Number(user.dailyCalories) || 0,
    protein: Number(user.proteinTarget) || 0,
  }
}

function isDailyDietTargetComplete(log, userTargets = {}) {
  if (!areDailyMealsComplete(log)) return false

  const totals = macroTotals(log?.meals)
  const caloriesEaten = Number(totals.calories || log?.totalCaloriesEaten) || 0

  if (userTargets.calories > 0) {
    const calorieRatio = caloriesEaten / userTargets.calories
    if (calorieRatio < 0.85 || calorieRatio > 1.15) return false
  }

  if (userTargets.protein > 0 && totals.protein < userTargets.protein * 0.7) {
    return false
  }

  return true
}

function calcScore(log, userTargets = {}) {
  let score = 0
  if (log.workoutDone) score += 25
  if (isDailyDietTargetComplete(log, userTargets)) score += 20
  if ((log.waterGlasses ?? 0) >= 8) score += 15
  if ((log.habits?.length ?? 0) >= 3) score += 20
  if (log.mindDone) score += 10
  if (log.challengesDone >= 1) score += 10
  return Math.min(score, 100)
}

function areDailyMealsComplete(log) {
  const meals = log?.meals || {}
  return ['breakfast', 'lunch', 'dinner'].every(meal => (meals[meal]?.length ?? 0) > 0)
    && ((meals.snacks?.length ?? 0) > 0 || (meals.snack?.length ?? 0) > 0)
}

async function getUserScoreTargets(uid) {
  const user = await User.findOne({ uid }).select('dailyCalories proteinTarget').lean()
  return getScoreTargets(user)
}

// GET /api/users/log/:date  (YYYY-MM-DD)
router.get('/log/:date', async (req, res) => {
  try {
    let log = await DailyLog.findOne({ uid: req.uid, date: req.params.date })
    if (!log) {
      log = new DailyLog(emptyLog(req.uid, req.params.date))
      await log.save()
    }
    res.json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/users/log/:date  (partial update)
router.patch('/log/:date', async (req, res) => {
  try {
    const updates = { ...req.body }
    // Recompute discipline score from merged data if partial fields provided
    const existing = await DailyLog.findOne({ uid: req.uid, date: req.params.date })
    const merged = { ...(existing?.toObject() ?? emptyLog(req.uid, req.params.date)), ...updates }
    merged.disciplineScore = calcScore(merged, await getUserScoreTargets(req.uid))

    const log = await DailyLog.findOneAndUpdate(
      { uid: req.uid, date: req.params.date },
      { $set: merged },
      { new: true, upsert: true }
    )
    res.json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/users/log/:date/water
router.patch('/log/:date/water', async (req, res) => {
  try {
    const { glasses } = req.body
    const existing = await DailyLog.findOne({ uid: req.uid, date: req.params.date })
    const base = existing?.toObject() ?? emptyLog(req.uid, req.params.date)
    const merged = { ...base, waterGlasses: glasses }
    merged.disciplineScore = calcScore(merged, await getUserScoreTargets(req.uid))

    const log = await DailyLog.findOneAndUpdate(
      { uid: req.uid, date: req.params.date },
      { $set: merged },
      { new: true, upsert: true }
    )
    res.json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/users/log/:date/meal
router.patch('/log/:date/meal', async (req, res) => {
  try {
    const { meal, food } = req.body
    const existing = await DailyLog.findOne({ uid: req.uid, date: req.params.date })
    const base = existing?.toObject() ?? emptyLog(req.uid, req.params.date)
    const meals = { ...base.meals }
    meals[meal] = [...(meals[meal] ?? []), food]
    const totalCaloriesEaten = (base.totalCaloriesEaten ?? 0) + (food.calories ?? 0)
    const merged = { ...base, meals, totalCaloriesEaten }
    merged.disciplineScore = calcScore(merged, await getUserScoreTargets(req.uid))

    const log = await DailyLog.findOneAndUpdate(
      { uid: req.uid, date: req.params.date },
      { $set: merged },
      { new: true, upsert: true }
    )
    res.json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/users/log/:date/workout
router.patch('/log/:date/workout', async (req, res) => {
  try {
    const { workout } = req.body
    const existing = await DailyLog.findOne({ uid: req.uid, date: req.params.date })
    const base = existing?.toObject() ?? emptyLog(req.uid, req.params.date)
    const merged = { ...base, workout, workoutDone: true }
    merged.disciplineScore = calcScore(merged, await getUserScoreTargets(req.uid))

    const log = await DailyLog.findOneAndUpdate(
      { uid: req.uid, date: req.params.date },
      { $set: merged },
      { new: true, upsert: true }
    )
    res.json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/users/log/:date/habits
router.patch('/log/:date/habits', async (req, res) => {
  try {
    const { habits } = req.body
    const existing = await DailyLog.findOne({ uid: req.uid, date: req.params.date })
    const base = existing?.toObject() ?? emptyLog(req.uid, req.params.date)
    const merged = { ...base, habits }
    merged.disciplineScore = calcScore(merged, await getUserScoreTargets(req.uid))

    const log = await DailyLog.findOneAndUpdate(
      { uid: req.uid, date: req.params.date },
      { $set: merged },
      { new: true, upsert: true }
    )
    res.json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/users/logs/month/:year/:month
router.get('/logs/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end   = `${year}-${String(month).padStart(2, '0')}-31`
    const logs = await DailyLog.find({ uid: req.uid, date: { $gte: start, $lte: end } })
    const map = {}
    logs.forEach(l => { map[l.date] = l })
    res.json({ success: true, data: map })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/users/logs/recent  (last 30 days)
router.get('/logs/recent', async (req, res) => {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    const logs = await DailyLog.find({ uid: req.uid, date: { $gte: cutoffStr } }).sort({ date: -1 })
    res.json({ success: true, data: logs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── WORKOUT HISTORY ─────────────────────────────────────────────────────────

// POST /api/users/workout
router.post('/workout', async (req, res) => {
  try {
    const { planId, planName, duration, caloriesBurned, exercisesCompleted, totalExercises } = req.body
    const today = todayStr()

    // Save workout history record
    const record = new WorkoutHistory({
      uid: req.uid,
      date: today,
      planId:             planId             ?? null,
      planName:           planName           ?? null,
      duration:           duration           ?? 0,
      caloriesBurned:     caloriesBurned     ?? 0,
      exercisesCompleted: exercisesCompleted ?? 0,
      totalExercises:     totalExercises     ?? 0,
    })
    await record.save()

    // Update user counters
    const user = await User.findOne({ uid: req.uid })
    const newStreak = calcStreak(user?.lastWorkoutDate, user?.streakCount ?? 0)
    const newBest   = Math.max(user?.bestStreak ?? 0, newStreak)
    const newTotal  = (user?.totalWorkouts ?? 0) + 1

    const updatedUser = await User.findOneAndUpdate(
      { uid: req.uid },
      { $set: { streakCount: newStreak, bestStreak: newBest, totalWorkouts: newTotal, lastWorkoutDate: today } },
      { new: true, upsert: true }
    )

    res.json({ success: true, data: { record, user: updatedUser, newStreak } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/users/workout/history
router.get('/workout/history', async (req, res) => {
  try {
    const count = parseInt(req.query.count ?? '20')
    const records = await WorkoutHistory.find({ uid: req.uid }).sort({ date: -1 }).limit(count)
    res.json({ success: true, data: records })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── WEIGHT LOGS ─────────────────────────────────────────────────────────────

// POST /api/users/weight
router.post('/weight', async (req, res) => {
  try {
    const { weight, date } = req.body
    const logDate = date ?? todayStr()
    const log = await WeightLog.findOneAndUpdate(
      { uid: req.uid, date: logDate },
      { $set: { weight: parseFloat(weight), unit: 'kg', loggedAt: new Date() } },
      { new: true, upsert: true }
    )
    // Update current weight on profile
    await User.findOneAndUpdate({ uid: req.uid }, { $set: { currentWeight: parseFloat(weight) } })
    res.json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/users/weight/history
router.get('/weight/history', async (req, res) => {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 56)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    const logs = await WeightLog.find({ uid: req.uid, date: { $gte: cutoffStr } }).sort({ date: 1 })
    res.json({ success: true, data: logs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── STATS ───────────────────────────────────────────────────────────────────

// GET /api/users/stats
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid })
    if (!user) return res.json({ success: true, data: { streakCount: 0, bestStreak: 0, totalWorkouts: 0 } })
    res.json({
      success: true,
      data: {
        streakCount:   user.streakCount,
        bestStreak:    user.bestStreak,
        totalWorkouts: user.totalWorkouts,
        lastWorkoutDate: user.lastWorkoutDate,
        disciplineScore: user.disciplineScore,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/users/account
router.delete('/account', async (req, res) => {
  try {
    try {
      await admin.auth().deleteUser(req.uid)
    } catch (authErr) {
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr
      }
    }

    await Promise.all([
      User.deleteOne({ uid: req.uid }),
      DailyLog.deleteMany({ uid: req.uid }),
      WeightLog.deleteMany({ uid: req.uid }),
      WorkoutHistory.deleteMany({ uid: req.uid }),
    ])

    res.json({
      success: true,
      message: 'Account and Firebase user deleted',
      data: { appDataDeleted: true, firebaseUserDeleted: true },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/users/habits/daily — personalised habits for today
router.get('/habits/daily', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid }).lean()
    const habits = getPersonalisedHabits(req.uid, user || {}, 5)
    res.json({ success: true, data: habits })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
