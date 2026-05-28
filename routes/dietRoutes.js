const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const requirePro = require('../middleware/planCheck')
const User = require('../models/User')
const { searchFood, generateMealPlan, suggestMeals } = require('../services/openaiService')

// All diet routes require auth + pro plan
router.use(verifyToken)
// TODO: Re-enable after testing
// router.use(requirePro)

// ─── RATE LIMITING HELPERS ───────────────────────────────────────────────────

const LIMITS = {
  searches: 20,      // per day
  suggestions: 5,    // per day
  plans: 2,          // per week
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekStr() {
  const d = new Date()
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${weekNum}`
}

async function checkAndIncrementUsage(uid, type) {
  const user = await User.findOne({ uid }).lean()
  const usage = user?.dietUsage || { searches: 0, suggestions: 0, plans: 0, lastReset: null, lastPlanReset: null }
  const today = todayStr()
  const week = weekStr()

  // Reset daily counters if new day
  if (usage.lastReset !== today) {
    usage.searches = 0
    usage.suggestions = 0
    usage.lastReset = today
  }

  // Reset weekly plan counter if new week
  if (usage.lastPlanReset !== week) {
    usage.plans = 0
    usage.lastPlanReset = week
  }

  // Check limit
  if (type === 'searches' && usage.searches >= LIMITS.searches) {
    return { allowed: false, message: `Daily search limit reached (${LIMITS.searches}/day). Try again tomorrow!` }
  }
  if (type === 'suggestions' && usage.suggestions >= LIMITS.suggestions) {
    return { allowed: false, message: `Daily suggestion limit reached (${LIMITS.suggestions}/day). Try again tomorrow!` }
  }
  if (type === 'plans' && usage.plans >= LIMITS.plans) {
    return { allowed: false, message: `Weekly plan limit reached (${LIMITS.plans}/week). Try next week!` }
  }

  // Increment
  usage[type] = (usage[type] || 0) + 1

  await User.findOneAndUpdate({ uid }, { $set: { dietUsage: usage } })
  return { allowed: true, remaining: LIMITS[type] - usage[type] }
}

// ─── POST /api/diet/search ───────────────────────────────────────────────────

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' })
    }

    if (query.length > 200) {
      return res.status(400).json({ success: false, message: 'Query too long (max 200 characters)' })
    }

    // Rate limit check
    const rateCheck = await checkAndIncrementUsage(req.uid, 'searches')
    if (!rateCheck.allowed) {
      return res.status(429).json({ success: false, message: rateCheck.message, code: 'RATE_LIMITED' })
    }

    const dietType = req.userProfile?.dietType || 'any'
    const { results, tokensUsed } = await searchFood(query.trim(), dietType)

    // Format results for frontend
    const formatted = results.map((r, i) => ({
      id: `ai_${Date.now()}_${i}`,
      name: { en: r.name_en, hi: r.name_hi || r.name_en },
      serving: { en: r.serving_description, size: r.serving_size_g, unit: 'g' },
      calories: Math.round(r.calories || 0),
      protein: Math.round((r.protein || 0) * 10) / 10,
      carbs: Math.round((r.carbs || 0) * 10) / 10,
      fat: Math.round((r.fat || 0) * 10) / 10,
      fiber: Math.round((r.fiber || 0) * 10) / 10,
      dietType: r.diet_type || 'veg',
      confidence: r.confidence || 'medium',
      source: 'ai',
    }))

    res.json({
      success: true,
      results: formatted,
      remaining: rateCheck.remaining,
      tokensUsed,
    })
  } catch (err) {
    console.error('[Diet Search Error]', err.message)
    if (err.message?.includes('API key')) {
      return res.status(500).json({ success: false, message: 'AI service configuration error' })
    }
    res.status(500).json({ success: false, message: 'Food search failed. Please try again.' })
  }
})

// ─── POST /api/diet/meal-plan ────────────────────────────────────────────────

router.post('/meal-plan', async (req, res) => {
  try {
    // Rate limit check
    const rateCheck = await checkAndIncrementUsage(req.uid, 'plans')
    if (!rateCheck.allowed) {
      return res.status(429).json({ success: false, message: rateCheck.message, code: 'RATE_LIMITED' })
    }

    const profile = req.userProfile || {}
    const { plan, tokensUsed } = await generateMealPlan(profile)

    const response = {
      generatedAt: new Date().toISOString(),
      days: plan,
      userCalories: profile.dailyCalories || 1800,
      userDietType: profile.dietType || 'veg',
    }

    res.json({
      success: true,
      plan: response,
      remaining: rateCheck.remaining,
      tokensUsed,
    })
  } catch (err) {
    console.error('[Meal Plan Error]', err.message)
    res.status(500).json({ success: false, message: 'Meal plan generation failed. Please try again.' })
  }
})

// ─── POST /api/diet/suggest ──────────────────────────────────────────────────

router.post('/suggest', async (req, res) => {
  try {
    const { remainingCalories, remainingProtein, remainingCarbs, remainingFat, mealType } = req.body

    if (!remainingCalories || remainingCalories <= 0) {
      return res.status(400).json({ success: false, message: 'No remaining calories — you hit your target!' })
    }

    // Rate limit check
    const rateCheck = await checkAndIncrementUsage(req.uid, 'suggestions')
    if (!rateCheck.allowed) {
      return res.status(429).json({ success: false, message: rateCheck.message, code: 'RATE_LIMITED' })
    }

    const remaining = {
      calories: remainingCalories || 500,
      protein: remainingProtein || 30,
      carbs: remainingCarbs || 60,
      fat: remainingFat || 20,
    }

    const dietType = req.userProfile?.dietType || 'any'
    const { suggestions, tokensUsed } = await suggestMeals(remaining, mealType, dietType)

    // Format suggestions
    const formatted = suggestions.map((s, i) => ({
      id: `suggest_${Date.now()}_${i}`,
      name: s.name,
      calories: Math.round(s.calories || 0),
      protein: Math.round((s.protein || 0) * 10) / 10,
      carbs: Math.round((s.carbs || 0) * 10) / 10,
      fat: Math.round((s.fat || 0) * 10) / 10,
      dietType: s.diet_type || dietType,
      why: s.why || '',
      source: 'ai',
    }))

    res.json({
      success: true,
      suggestions: formatted,
      remaining: rateCheck.remaining,
      tokensUsed,
    })
  } catch (err) {
    console.error('[Suggest Error]', err.message)
    res.status(500).json({ success: false, message: 'Suggestions failed. Please try again.' })
  }
})

// ─── GET /api/diet/usage ─────────────────────────────────────────────────────

router.get('/usage', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid }).lean()
    const usage = user?.dietUsage || { searches: 0, suggestions: 0, plans: 0 }
    const today = todayStr()
    const week = weekStr()

    // Reset if stale
    const searches = usage.lastReset === today ? usage.searches : 0
    const suggestions = usage.lastReset === today ? usage.suggestions : 0
    const plans = usage.lastPlanReset === week ? usage.plans : 0

    res.json({
      success: true,
      usage: {
        searches: { used: searches, limit: LIMITS.searches },
        suggestions: { used: suggestions, limit: LIMITS.suggestions },
        plans: { used: plans, limit: LIMITS.plans },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get usage' })
  }
})

module.exports = router
