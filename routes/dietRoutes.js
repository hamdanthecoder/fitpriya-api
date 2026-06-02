const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const requirePro = require('../middleware/planCheck')
const User = require('../models/User')
const { searchFood, generateMealPlan, suggestMeals } = require('../services/openaiService')

// All diet routes require auth
router.use(verifyToken)
// TODO: Re-enable after testing
// router.use(requirePro)

// ─── RATE LIMITING HELPERS ───────────────────────────────────────────────────

const LIMITS = {
  free: { searches: 8, suggestions: 0, plans: 1 },
  pro:  { searches: 50, suggestions: 5, plans: 2 },
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
  const userPlan = user?.plan === 'pro' ? 'pro' : 'free'
  const limits = LIMITS[userPlan]
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
  if (type === 'searches' && usage.searches >= limits.searches) {
    const msg = userPlan === 'free'
      ? `Free limit reached (${limits.searches}/day). Upgrade to Pro for 20 searches/day!`
      : `Daily search limit reached (${limits.searches}/day). Try again tomorrow!`
    return { allowed: false, message: msg, code: userPlan === 'free' ? 'FREE_LIMIT' : 'RATE_LIMITED' }
  }
  if (type === 'suggestions' && usage.suggestions >= limits.suggestions) {
    const msg = userPlan === 'free'
      ? 'Smart Suggestions is a Pro feature. Upgrade to unlock!'
      : `Daily suggestion limit reached (${limits.suggestions}/day). Try again tomorrow!`
    return { allowed: false, message: msg, code: userPlan === 'free' ? 'PRO_REQUIRED' : 'RATE_LIMITED' }
  }
  if (type === 'plans' && usage.plans >= limits.plans) {
    const msg = userPlan === 'free'
      ? 'You\'ve used your free plan generation. Upgrade to Pro to regenerate anytime!'
      : `Weekly plan limit reached (${limits.plans}/week). Try next week!`
    return { allowed: false, message: msg, code: userPlan === 'free' ? 'FREE_LIMIT' : 'RATE_LIMITED' }
  }

  // Increment
  usage[type] = (usage[type] || 0) + 1

  await User.findOneAndUpdate({ uid }, { $set: { dietUsage: usage } })
  return { allowed: true, remaining: limits[type] - usage[type] }
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

    // Sanitize input — strip HTML, scripts, and dangerous characters
    const sanitizedQuery = query.trim()
      .replace(/<[^>]*>/g, '')           // strip HTML tags
      .replace(/[{}$]/g, '')             // strip MongoDB operators
      .replace(/javascript:/gi, '')      // strip JS protocol
      .replace(/on\w+=/gi, '')           // strip event handlers
      .substring(0, 200);

    // Rate limit check
    const rateCheck = await checkAndIncrementUsage(req.uid, 'searches')
    if (!rateCheck.allowed) {
      return res.status(429).json({ success: false, message: rateCheck.message, code: 'RATE_LIMITED' })
    }

    const user = await User.findOne({ uid: req.uid }).lean()
    const dietType = user?.dietType || 'any'
    const { results, tokensUsed } = await searchFood(sanitizedQuery, dietType)

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
    // Check limit (but don't increment yet)
    const user = await User.findOne({ uid: req.uid }).lean() || {}
    const userPlan = user?.plan === 'pro' ? 'pro' : 'free'
    const limits = LIMITS[userPlan]
    const usage = user?.dietUsage || { searches: 0, suggestions: 0, plans: 0, lastReset: null, lastPlanReset: null }
    const week = weekStr()

    // Reset weekly plan counter if new week
    if (usage.lastPlanReset !== week) {
      usage.plans = 0
      usage.lastPlanReset = week
    }

    // Check if over limit
    if (usage.plans >= limits.plans) {
      const msg = userPlan === 'free'
        ? 'You\'ve used your free plan generation. Upgrade to Pro to regenerate anytime!'
        : `Weekly plan limit reached (${limits.plans}/week). Try next week!`
      return res.status(429).json({ success: false, message: msg, code: 'RATE_LIMITED' })
    }

    // Generate the plan FIRST
    const profile = user
    const { plan, tokensUsed } = await generateMealPlan(profile)

    // Only increment AFTER successful generation
    usage.plans = (usage.plans || 0) + 1
    await User.findOneAndUpdate({ uid: req.uid }, { $set: { dietUsage: usage } })

    const response = {
      generatedAt: new Date().toISOString(),
      days: plan,
      userCalories: profile.dailyCalories || 1800,
      userDietType: profile.dietType || 'veg',
    }

    res.json({
      success: true,
      plan: response,
      remaining: limits.plans - usage.plans,
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

    const dietType = (await User.findOne({ uid: req.uid }).lean())?.dietType || 'any'
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

// ─── POST /api/diet/reset-plan-usage (temp — reset failed plan counter) ──────

router.post('/reset-plan-usage', async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { uid: req.uid },
      { $set: { 'dietUsage.plans': 0 } }
    )
    res.json({ success: true, message: 'Plan usage reset' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
