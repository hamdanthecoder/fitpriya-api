const express = require('express')
const router  = express.Router()
const Food    = require('../models/Food')
const { getDisplayName } = require('../utils/foodHelpers')

function formatFood(food) {
  const n = food.nutrition || {}
  return {
    id:           food._id,
    name:         food.name || { en: '', hi: '' },
    serving:      food.serving || { size: 100, unit: 'g', description: { en: '100g', hi: '100 ग्राम' } },
    calories:     n.calories  ?? 0,
    protein:      n.protein   ?? 0,
    carbs:        n.carbs     ?? 0,
    fat:          n.fat       ?? 0,
    fiber:        n.fiber     ?? 0,
    sugar:        n.sugar     ?? 0,
    sodium:       n.sodium    ?? 0,
    calcium:      n.calcium   ?? 0,
    iron:         n.iron      ?? 0,
    vitaminC:     n.vitaminC  ?? 0,
    potassium:    n.potassium ?? 0,
    mealType:     food.mealType  || [],
    dietType:     food.dietType  || [],
    region:       food.region    || [],
    category:     food.category  || food.cuisine || '',
    cuisine:      food.cuisine   || 'global',
    isIndian:     food.isIndian  ?? false,
    isGlobal:     food.isGlobal  ?? false,
    isIndianStyle:food.isIndianStyle ?? false,
    healthRating: food.healthRating ?? 5,
    glycemicIndex:food.glycemicIndex ?? null,
    portionTip:   food.portionTip || null,
    source:       food.source,
    barcode:      food.barcode || null,
    brand:        food.brand   || null,
    ingredients:  food.ingredients || [],
    tags:         food.tags || [],
    hasNutrition: (n.calories ?? 0) > 0
  }
}

// GET /api/foods/search?q=poha&diet=veg&meal=breakfast&cuisine=indian&limit=20&page=1
router.get('/search', async (req, res) => {
  try {
    const { q, diet, meal, cuisine, region, minCal, maxCal,
            limit = 20, page = 1, nutritionOnly } = req.query

    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' })
    }

    // Search both English and Hindi names
    const query = {
      $or: [
        { 'name.en': { $regex: q, $options: 'i' } },
        { 'name.hi': { $regex: q, $options: 'i' } }
      ]
    }

    if (diet) {
      const dietMap = { veg: 'veg', 'non-veg': 'non-veg', vegan: 'vegan', jain: 'jain', egg: 'egg' }
      query.dietType = dietMap[diet] || diet
    }
    if (meal)    query.mealType = { $regex: meal, $options: 'i' }
    if (cuisine) query.cuisine  = { $regex: cuisine, $options: 'i' }
    if (region)  query.region   = { $regex: region, $options: 'i' }

    if (minCal || maxCal) {
      query['nutrition.calories'] = {}
      if (minCal) query['nutrition.calories'].$gte = Number(minCal)
      if (maxCal) query['nutrition.calories'].$lte = Number(maxCal)
    }
    if (nutritionOnly === 'true') {
      query['nutrition.calories'] = { ...(query['nutrition.calories'] || {}), $gt: 0 }
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [foods, total] = await Promise.all([
      Food.find(query).sort({ 'nutrition.calories': -1, 'name.en': 1 }).limit(Number(limit)).skip(skip).lean(),
      Food.countDocuments(query)
    ])

    res.json({
      success: true, query: q, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)),
      results: foods.map(formatFood)
    })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ success: false, message: 'Search failed', error: err.message })
  }
})

// GET /api/foods/stats/overview
router.get('/stats/overview', async (req, res) => {
  try {
    const [total, indian, global_, withNutrition, byCuisine, byDiet, byMeal, bySource] = await Promise.all([
      Food.countDocuments(),
      Food.countDocuments({ isIndian: true }),
      Food.countDocuments({ isGlobal: true }),
      Food.countDocuments({ 'nutrition.calories': { $gt: 0 } }),
      Food.aggregate([{ $group: { _id: '$cuisine', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Food.aggregate([{ $unwind: '$dietType' }, { $group: { _id: '$dietType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Food.aggregate([{ $unwind: '$mealType' }, { $group: { _id: '$mealType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Food.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ])

    res.json({
      success: true,
      stats: { total, indian, global: global_, withNutrition, byCuisine, byDietType: byDiet, byMealType: byMeal, bySource }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Stats failed', error: err.message })
  }
})

// GET /api/foods/popular/:mealType
router.get('/popular/:mealType', async (req, res) => {
  try {
    const foods = await Food.find({
      mealType: req.params.mealType,
      'nutrition.calories': { $gt: 0 }
    }).sort({ healthRating: -1, 'nutrition.calories': -1 }).limit(20).lean()

    res.json({ success: true, mealType: req.params.mealType, count: foods.length, foods: foods.map(formatFood) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message })
  }
})

// GET /api/foods/barcode/:barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const food = await Food.findOne({ barcode: req.params.barcode }).lean()
    if (!food) return res.status(404).json({ success: false, message: 'Not found', barcode: req.params.barcode })
    res.json({ success: true, food: formatFood(food) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Barcode lookup failed', error: err.message })
  }
})

// GET /api/foods/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const foods = await Food.find({
      $or: [
        { cuisine: { $regex: req.params.category, $options: 'i' } },
        { tags:    { $regex: req.params.category, $options: 'i' } }
      ]
    }).limit(50).lean()

    res.json({ success: true, category: req.params.category, count: foods.length, foods: foods.map(formatFood) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message })
  }
})

// POST /api/foods/meal-plan
router.post('/meal-plan', async (req, res) => {
  try {
    const { targetCalories = 1800, dietType = 'veg', meals = ['breakfast', 'lunch', 'dinner', 'snack'] } = req.body
    const calPerMeal = {
      breakfast: Math.round(targetCalories * 0.25),
      lunch:     Math.round(targetCalories * 0.35),
      dinner:    Math.round(targetCalories * 0.30),
      snack:     Math.round(targetCalories * 0.10)
    }

    const mealPlan = {}
    for (const meal of meals) {
      const target = calPerMeal[meal] || Math.round(targetCalories / meals.length)
      const foods = await Food.find({
        mealType: meal,
        dietType: dietType,
        'nutrition.calories': { $gte: target - 100, $lte: target + 100 }
      }).limit(3).lean()
      mealPlan[meal] = foods.map(formatFood)
    }

    res.json({ success: true, targetCalories, dietType, mealPlan })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Meal plan failed', error: err.message })
  }
})

// GET /api/foods/:id
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).lean()
    if (!food) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, food: formatFood(food) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message })
  }
})

module.exports = router
