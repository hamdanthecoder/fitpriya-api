const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const User = require('../models/User')
const { searchFood, generateMealPlan, suggestMeals } = require('../services/openaiService')

// All diet routes require auth
router.use(verifyToken)

// ─── RATE LIMITING HELPERS ───────────────────────────────────────────────────

const LIMITS = {
  free: { searches: 8, suggestions: 0, plans: 1 },
  pro:  { searches: 50, suggestions: 5, plans: 2 },
}

const EMPTY_USAGE = {
  searches: 0,
  suggestions: 0,
  plans: 0,
  lastReset: null,
  lastPlanReset: null,
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

async function checkAndIncrementUsage(uid, type, options = {}) {
  const shouldIncrement = options.increment !== false
  const user = await User.findOne({ uid }).lean()
  const userPlan = user?.plan === 'pro' ? 'pro' : 'free'
  const limits = LIMITS[userPlan]
  const usage = normalizeUsage(user?.dietUsage)

  // Check limit
  if (type === 'searches' && usage.searches >= limits.searches) {
    const msg = userPlan === 'free'
      ? `Free limit reached (${limits.searches}/day). Upgrade to Pro for ${LIMITS.pro.searches} searches/day!`
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

  if (!shouldIncrement) {
    return { allowed: true, remaining: limits[type] - (usage[type] || 0), usage, limits }
  }

  // Increment
  usage[type] = (usage[type] || 0) + 1
  await User.findOneAndUpdate({ uid }, { $set: { dietUsage: usage } })
  return { allowed: true, remaining: limits[type] - usage[type] }
}

function normalizeUsage(raw = {}) {
  const usage = { ...EMPTY_USAGE, ...raw }
  const today = todayStr()
  const week = weekStr()

  if (usage.lastReset !== today) {
    usage.searches = 0
    usage.suggestions = 0
    usage.lastReset = today
  }

  if (usage.lastPlanReset !== week) {
    usage.plans = 0
    usage.lastPlanReset = week
  }

  return usage
}

function getUserPlan(user) {
  return user?.plan === 'pro' ? 'pro' : 'free'
}

function planLimitError(userPlan, limits) {
  const message = userPlan === 'free'
    ? 'You\'ve used your free plan generation. Upgrade to Pro to regenerate anytime!'
    : `Weekly plan limit reached (${limits.plans}/week). Try next week!`
  return { success: false, message, code: userPlan === 'free' ? 'FREE_LIMIT' : 'RATE_LIMITED' }
}

// ─── POST /api/diet/search ───────────────────────────────────────────────────

const FALLBACK_MEALS = {
  veg: {
    breakfast: [
      { name: 'Poha with peanuts and curd', calories: 420, protein: 15, carbs: 62, fat: 12, prep_time: '15 min' },
      { name: 'Paneer bhurji with 2 roti', calories: 480, protein: 26, carbs: 42, fat: 22, prep_time: '20 min' },
      { name: 'Vegetable upma with curd', calories: 400, protein: 14, carbs: 58, fat: 11, prep_time: '15 min' },
    ],
    lunch: [
      { name: 'Dal, 2 roti, sabzi, and salad', calories: 560, protein: 24, carbs: 78, fat: 14, prep_time: '25 min' },
      { name: 'Rajma chawal with cucumber salad', calories: 610, protein: 22, carbs: 96, fat: 12, prep_time: '30 min' },
      { name: 'Paneer rice bowl with salad', calories: 640, protein: 30, carbs: 72, fat: 22, prep_time: '25 min' },
    ],
    dinner: [
      { name: 'Moong dal khichdi with curd', calories: 460, protein: 20, carbs: 66, fat: 12, prep_time: '20 min' },
      { name: 'Paneer tikka with 2 roti and salad', calories: 520, protein: 28, carbs: 42, fat: 24, prep_time: '25 min' },
      { name: 'Dal soup, roti, and sauteed vegetables', calories: 480, protein: 22, carbs: 58, fat: 14, prep_time: '25 min' },
    ],
    snack: [
      { name: 'Fruit with roasted chana', calories: 240, protein: 10, carbs: 42, fat: 4, prep_time: '5 min' },
      { name: 'Hung curd bowl with fruit', calories: 220, protein: 18, carbs: 24, fat: 6, prep_time: '5 min' },
      { name: 'Sprouts chaat', calories: 260, protein: 14, carbs: 38, fat: 6, prep_time: '10 min' },
    ],
  },
  non_veg: {
    breakfast: [
      { name: '2 egg omelette with 2 roti', calories: 390, protein: 22, carbs: 38, fat: 15, prep_time: '15 min' },
      { name: 'Egg bhurji with toast', calories: 430, protein: 24, carbs: 42, fat: 17, prep_time: '15 min' },
      { name: 'Chicken sandwich with curd', calories: 460, protein: 30, carbs: 44, fat: 14, prep_time: '15 min' },
    ],
    lunch: [
      { name: 'Chicken curry with rice and salad', calories: 620, protein: 38, carbs: 70, fat: 18, prep_time: '30 min' },
      { name: 'Grilled chicken, dal, 2 roti, and salad', calories: 650, protein: 45, carbs: 62, fat: 18, prep_time: '30 min' },
      { name: 'Fish curry with rice and vegetables', calories: 600, protein: 38, carbs: 68, fat: 16, prep_time: '25 min' },
    ],
    dinner: [
      { name: 'Grilled fish with dal and vegetables', calories: 500, protein: 40, carbs: 35, fat: 18, prep_time: '25 min' },
      { name: 'Chicken tikka with roti and salad', calories: 520, protein: 42, carbs: 38, fat: 18, prep_time: '25 min' },
      { name: 'Egg curry with 2 roti and salad', calories: 520, protein: 26, carbs: 48, fat: 22, prep_time: '25 min' },
    ],
    snack: [
      { name: 'Boiled eggs with fruit', calories: 260, protein: 16, carbs: 28, fat: 9, prep_time: '8 min' },
      { name: 'Curd bowl with roasted chana', calories: 250, protein: 16, carbs: 30, fat: 7, prep_time: '5 min' },
      { name: 'Chicken soup', calories: 220, protein: 24, carbs: 14, fat: 7, prep_time: '15 min' },
    ],
  },
  vegan: {
    breakfast: [
      { name: 'Vegetable poha with peanuts', calories: 410, protein: 12, carbs: 62, fat: 13, prep_time: '15 min' },
      { name: 'Besan chilla with chutney', calories: 430, protein: 18, carbs: 48, fat: 16, prep_time: '20 min' },
      { name: 'Oats with banana and peanut butter', calories: 450, protein: 14, carbs: 65, fat: 15, prep_time: '10 min' },
    ],
    lunch: [
      { name: 'Rajma chawal with salad', calories: 610, protein: 22, carbs: 96, fat: 12, prep_time: '30 min' },
      { name: 'Chana masala with 2 roti and salad', calories: 600, protein: 24, carbs: 82, fat: 14, prep_time: '30 min' },
      { name: 'Tofu rice bowl with vegetables', calories: 590, protein: 28, carbs: 70, fat: 18, prep_time: '25 min' },
    ],
    dinner: [
      { name: 'Moong dal khichdi with vegetables', calories: 470, protein: 20, carbs: 68, fat: 12, prep_time: '20 min' },
      { name: 'Tofu bhurji with 2 roti', calories: 520, protein: 30, carbs: 48, fat: 20, prep_time: '25 min' },
      { name: 'Dal soup with roti and salad', calories: 460, protein: 20, carbs: 60, fat: 12, prep_time: '20 min' },
    ],
    snack: [
      { name: 'Fruit with roasted peanuts', calories: 260, protein: 8, carbs: 36, fat: 10, prep_time: '5 min' },
      { name: 'Sprouts chaat', calories: 260, protein: 14, carbs: 38, fat: 6, prep_time: '10 min' },
      { name: 'Peanut chikki with fruit', calories: 280, protein: 8, carbs: 42, fat: 9, prep_time: '5 min' },
    ],
  },
}

function dietBucket(dietType = 'veg') {
  const d = String(dietType).toLowerCase()
  if (d.includes('vegan')) return 'vegan'
  if (d.includes('non') || d.includes('chicken') || d.includes('fish') || d.includes('egg')) return 'non_veg'
  return 'veg'
}

function scaleMeal(meal, targetCalories) {
  const factor = Math.max(0.75, Math.min(1.35, targetCalories / Math.max(1, meal.calories)))
  return {
    ...meal,
    calories: Math.round(meal.calories * factor),
    protein: Math.round(meal.protein * factor),
    carbs: Math.round(meal.carbs * factor),
    fat: Math.round(meal.fat * factor),
  }
}

function generateFallbackMealPlan(profile = {}) {
  let calories = Number(profile.dailyCalories) || 1800
  if (calories < 1000 || calories > 5000) calories = 1800
  const meals = FALLBACK_MEALS[dietBucket(profile.dietType)] || FALLBACK_MEALS.veg
  const targets = {
    breakfast: Math.round(calories * 0.25),
    lunch: Math.round(calories * 0.35),
    dinner: Math.round(calories * 0.30),
    snack: Math.round(calories * 0.10),
  }

  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    breakfast: scaleMeal(meals.breakfast[i % meals.breakfast.length], targets.breakfast),
    lunch: scaleMeal(meals.lunch[i % meals.lunch.length], targets.lunch),
    dinner: scaleMeal(meals.dinner[i % meals.dinner.length], targets.dinner),
    snack: scaleMeal(meals.snack[i % meals.snack.length], targets.snack),
  }))
}

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
    const rateCheck = await checkAndIncrementUsage(req.uid, 'searches', { increment: false })
    if (!rateCheck.allowed) {
      return res.status(429).json({ success: false, message: rateCheck.message, code: 'RATE_LIMITED' })
    }

    const user = await User.findOne({ uid: req.uid }).lean()
    const dietType = user?.dietType || 'any'
    const { results, tokensUsed, source } = await searchFood(sanitizedQuery, dietType)
    const usageUpdate = await checkAndIncrementUsage(req.uid, 'searches')

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
      source: source === 'fallback' ? 'local' : 'ai',
    }))

    res.json({
      success: true,
      results: formatted,
      remaining: usageUpdate.remaining,
      tokensUsed,
      source: source || 'ai',
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
    // Fetch user profile
    const profile = await User.findOne({ uid: req.uid }).lean() || {}
    const userPlan = getUserPlan(profile)
    const limits = LIMITS[userPlan]
    const usage = normalizeUsage(profile?.dietUsage)
    const hasStoredPlan = Array.isArray(profile?.currentPlan?.days) && profile.currentPlan.days.length > 0
    const allowMissingPlanRecovery = userPlan === 'free' && usage.plans >= limits.plans && !hasStoredPlan

    if (usage.plans >= limits.plans && hasStoredPlan) {
      return res.json({
        success: true,
        plan: profile.currentPlan,
        remaining: 0,
        tokensUsed: 0,
        source: profile.currentPlan.source || 'stored',
        restored: true,
      })
    }

    if (usage.plans >= limits.plans && !allowMissingPlanRecovery) {
      return res.status(429).json(planLimitError(userPlan, limits))
    }

    // Generate the plan. If AI is unavailable, provide a deterministic emergency
    // plan so first-time users are not blocked by provider/network issues.
    let plan
    let tokensUsed = 0
    let source = 'ai'
    try {
      const result = await generateMealPlan(profile)
      plan = result.plan
      tokensUsed = result.tokensUsed
    } catch (generationErr) {
      console.error('[Meal Plan AI Fallback]', generationErr.message)
      plan = generateFallbackMealPlan(profile)
      source = 'fallback'
    }

    const response = {
      generatedAt: new Date().toISOString(),
      days: plan,
      userCalories: profile.dailyCalories || 1800,
      userDietType: profile.dietType || 'veg',
      source,
    }

    // Increment/store ONLY after a plan exists. Recovery keeps free usage at 1
    // instead of charging a second generation for old stuck accounts.
    usage.plans = allowMissingPlanRecovery ? Math.max(usage.plans || 0, 1) : (usage.plans || 0) + 1
    await User.findOneAndUpdate(
      { uid: req.uid },
      {
        $set: {
          dietUsage: usage,
          currentPlan: response,
          planGeneratedAt: response.generatedAt,
        },
      }
    )

    res.json({
      success: true,
      plan: response,
      remaining: limits.plans - usage.plans,
      tokensUsed,
      source,
      recovered: allowMissingPlanRecovery,
    })
  } catch (err) {
    console.error('[Meal Plan Error]', err.message)
    res.status(500).json({ success: false, message: err.message || 'Meal plan generation failed.' })
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
    const userPlan = getUserPlan(user)
    const limits = LIMITS[userPlan]
    const usage = normalizeUsage(user?.dietUsage)

    res.json({
      success: true,
      usage: {
        plan: userPlan,
        searches: { used: usage.searches, limit: limits.searches },
        suggestions: { used: usage.suggestions, limit: limits.suggestions },
        plans: { used: usage.plans, limit: limits.plans },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get usage' })
  }
})

module.exports = router
