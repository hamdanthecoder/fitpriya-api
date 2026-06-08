const OpenAI = require('openai')

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
let client

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  if (!client) {
    const clientOptions = { apiKey: process.env.OPENAI_API_KEY }
    if (process.env.OPENAI_BASE_URL) {
      clientOptions.baseURL = process.env.OPENAI_BASE_URL
    }
    client = new OpenAI(clientOptions)
  }

  return client
}

function logOpenAIError(scope, err) {
  console.error(`[OpenAI ${scope} Error]`, {
    name: err?.name,
    status: err?.status,
    code: err?.code,
    type: err?.type,
    message: err?.message,
  })
}

// ─── FOOD SEARCH ─────────────────────────────────────────────────────────────

const FOOD_SEARCH_SYSTEM = `You are a nutrition expert specializing in Indian and global foods.
Given a food query, return accurate nutrition information per standard serving.
Use IFCT (Indian Food Composition Tables) or USDA reference values.
For Indian home-cooked food, use standard household serving sizes.
If the query mentions a quantity (e.g. "2 roti"), multiply nutrition accordingly.
Always return at least 1 result, maximum 3 if the query is ambiguous.
Return ONLY valid JSON, no markdown or extra text.`

function buildFoodSearchPrompt(query, dietType) {
  return `Food query: "${query}"
User's diet preference: "${dietType || 'any'}"

Return JSON with this exact structure:
{
  "results": [
    {
      "name_en": "English name of the food",
      "name_hi": "Hindi name (Devanagari script)",
      "serving_description": "e.g. 2 roti + 1 bowl dal (with quantity)",
      "serving_size_g": 250,
      "calories": 380,
      "protein": 14.0,
      "carbs": 58.0,
      "fat": 8.0,
      "fiber": 6.0,
      "diet_type": "veg",
      "confidence": "high"
    }
  ]
}

Rules:
- calories, protein, carbs, fat, fiber must be numbers (not strings)
- diet_type must be one of: "veg", "non-veg", "vegan", "egg"
- confidence must be one of: "high", "medium", "low"
- "high" = well-known food with reliable data
- "medium" = estimated from similar foods
- "low" = rough estimate, actual may vary significantly
- Use standard Indian serving sizes (1 roti = ~30g, 1 bowl dal = ~150ml, 1 plate rice = ~150g)
- If user mentions brand name, estimate based on typical packaged food nutrition`
}

const FALLBACK_FOODS = [
  { keys: ['roti', 'chapati', 'phulka'], name_en: 'Roti', name_hi: 'Roti', serving_description: '1 medium roti', serving_size_g: 30, calories: 105, protein: 3.1, carbs: 21, fat: 0.8, fiber: 2.6, diet_type: 'veg' },
  { keys: ['rice', 'chawal', 'plain rice'], name_en: 'Cooked rice', name_hi: 'Chawal', serving_description: '1 bowl cooked rice', serving_size_g: 150, calories: 195, protein: 4.1, carbs: 43, fat: 0.4, fiber: 0.6, diet_type: 'vegan' },
  { keys: ['dal', 'daal', 'lentil'], name_en: 'Dal', name_hi: 'Dal', serving_description: '1 bowl dal', serving_size_g: 150, calories: 170, protein: 9, carbs: 26, fat: 4, fiber: 6, diet_type: 'veg' },
  { keys: ['poha'], name_en: 'Poha with peanuts', name_hi: 'Poha', serving_description: '1 plate poha', serving_size_g: 200, calories: 330, protein: 8, carbs: 52, fat: 10, fiber: 4, diet_type: 'veg' },
  { keys: ['idli'], name_en: 'Idli', name_hi: 'Idli', serving_description: '2 medium idli', serving_size_g: 120, calories: 150, protein: 5, carbs: 31, fat: 1, fiber: 2, diet_type: 'vegan' },
  { keys: ['dosa'], name_en: 'Plain dosa', name_hi: 'Dosa', serving_description: '1 medium dosa', serving_size_g: 100, calories: 180, protein: 4, carbs: 32, fat: 5, fiber: 2, diet_type: 'vegan' },
  { keys: ['paneer'], name_en: 'Paneer', name_hi: 'Paneer', serving_description: '100 g paneer', serving_size_g: 100, calories: 265, protein: 18, carbs: 4, fat: 20, fiber: 0, diet_type: 'veg' },
  { keys: ['egg', 'eggs', 'anda'], name_en: 'Boiled egg', name_hi: 'Anda', serving_description: '1 large egg', serving_size_g: 50, calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, diet_type: 'egg' },
  { keys: ['chicken'], name_en: 'Chicken curry', name_hi: 'Chicken curry', serving_description: '1 bowl chicken curry', serving_size_g: 180, calories: 300, protein: 28, carbs: 8, fat: 18, fiber: 2, diet_type: 'non-veg' },
  { keys: ['banana', 'kela'], name_en: 'Banana', name_hi: 'Kela', serving_description: '1 medium banana', serving_size_g: 118, calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1, diet_type: 'vegan' },
  { keys: ['apple', 'seb'], name_en: 'Apple', name_hi: 'Seb', serving_description: '1 medium apple', serving_size_g: 180, calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, diet_type: 'vegan' },
  { keys: ['chai', 'tea'], name_en: 'Milk tea', name_hi: 'Chai', serving_description: '1 cup milk tea with sugar', serving_size_g: 180, calories: 110, protein: 3, carbs: 16, fat: 4, fiber: 0, diet_type: 'veg' },
]

function fitsDiet(food, dietType) {
  if (!dietType || dietType === 'any') return true
  if (dietType === 'vegan') return food.diet_type === 'vegan'
  if (dietType === 'veg') return food.diet_type === 'veg' || food.diet_type === 'vegan'
  if (dietType === 'egg') return food.diet_type === 'egg' || food.diet_type === 'veg' || food.diet_type === 'vegan'
  return true
}

function scaleFood(food, query) {
  const lower = query.toLowerCase()
  const quantityMatch = lower.match(/\b(\d+(?:\.\d+)?)\b/)
  const quantity = quantityMatch ? Number(quantityMatch[1]) : 1
  const shouldScale = quantity > 0 && food.keys.some(key => lower.includes(key))
  const factor = shouldScale ? quantity : 1

  return {
    name_en: food.name_en,
    name_hi: food.name_hi,
    serving_description: factor === 1 ? food.serving_description : `${factor} x ${food.serving_description}`,
    serving_size_g: Math.round(food.serving_size_g * factor),
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
    fiber: Math.round(food.fiber * factor * 10) / 10,
    diet_type: food.diet_type,
    confidence: factor === 1 ? 'medium' : 'low',
  }
}

function fallbackSearchFood(query, dietType) {
  const lower = String(query || '').toLowerCase()
  const matches = FALLBACK_FOODS
    .filter(food => fitsDiet(food, dietType))
    .filter(food => food.keys.some(key => lower.includes(key)))

  const selected = matches.length ? matches : FALLBACK_FOODS.filter(food => fitsDiet(food, dietType)).slice(0, 3)
  return {
    results: selected.slice(0, 3).map(food => scaleFood(food, lower)),
    tokensUsed: 0,
    source: 'fallback',
  }
}

async function searchFood(query, dietType) {
  try {
    const response = await getClient().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: FOOD_SEARCH_SYSTEM },
        { role: 'user', content: buildFoodSearchPrompt(query, dietType) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 800,
    })

    const content = response.choices[0]?.message?.content
    const parsed = JSON.parse(content)
    const tokensUsed = response.usage?.total_tokens ?? 0

    return { results: parsed.results || [], tokensUsed, source: 'ai' }
  } catch (err) {
    logOpenAIError('Food Search', err)
    return fallbackSearchFood(query, dietType)
  }
}

// ─── MEAL PLAN GENERATOR ─────────────────────────────────────────────────────

const MEAL_PLAN_SYSTEM = `You are a certified Indian nutritionist creating personalized weekly meal plans.
Focus on practical, home-cooked Indian meals with variety.
Return ONLY valid JSON, no markdown or extra text.`

function buildMealPlanPrompt(profile) {
  let calories = Number(profile.dailyCalories) || 1800
  if (calories < 1000 || calories > 5000) calories = 1800
  const dietType = profile.dietType || 'veg'
  const goal = profile.goal || 'maintain'
  const time = profile.availableTime || '30 min'
  const gender = profile.gender || ''
  const age = profile.age || ''
  const weight = profile.currentWeight || 0
  const targetWeight = profile.targetWeight || 0
  const height = profile.height || 0
  const activityLevel = profile.activityLevel || 'moderate'
  const lifestyle = (profile.lifestyle || []).join(', ') || 'none specified'
  const focusAreas = (profile.focusAreas || []).join(', ') || 'general fitness'
  const proteinTarget = profile.proteinTarget || Math.round((calories * 0.25) / 4)
  const preferredTime = profile.preferredTime || 'morning'
  const mealFrequency = profile.mealFrequency || '3_meals'
  const stressLevel = profile.stressLevel || 'medium'
  const sleepHours = profile.sleepHours || '6_7'
  const biggestChallenge = profile.biggestChallenge || 'consistency'
  const mealCount = mealFrequency === '2_meals' ? 2 : mealFrequency === '5_meals' ? 5 : 4
  const distribution = mealFrequency === '2_meals'
    ? `lunch ~${Math.round(calories * 0.45)}, dinner ~${Math.round(calories * 0.45)}, snack ~${Math.round(calories * 0.10)}`
    : mealFrequency === '5_meals'
      ? `breakfast ~${Math.round(calories * 0.22)}, lunch ~${Math.round(calories * 0.28)}, dinner ~${Math.round(calories * 0.25)}, snack ~${Math.round(calories * 0.15)}, evening_snack ~${Math.round(calories * 0.10)}`
      : `breakfast ~${Math.round(calories * 0.25)}, lunch ~${Math.round(calories * 0.35)}, dinner ~${Math.round(calories * 0.30)}, snack ~${Math.round(calories * 0.10)}`

  return `Create a 7-day meal plan for this user:

USER PROFILE:
- Gender: ${gender}, Age: ${age}
- Current weight: ${weight}kg, Target weight: ${targetWeight}kg, Height: ${height}cm
- Activity level: ${activityLevel}
- Lifestyle: ${lifestyle}
- Focus areas: ${focusAreas}
- Preferred workout time: ${preferredTime}
- Stress level: ${stressLevel}
- Sleep pattern: ${sleepHours}
- Biggest obstacle: ${biggestChallenge}

NUTRITION TARGETS:
- Daily calorie target: ${calories} kcal (MUST match this closely)
- Daily protein target: ${proteinTarget}g
- Diet type: ${dietType} (STRICTLY follow — no exceptions)
- Fitness goal: ${goal}

PREFERENCES:
- Available cooking time: ${time}
- Meal rhythm: ${mealFrequency}
- Cuisine: Indian home-cooked meals (with some variety)
- Practical meals that are easy to prepare
- If stress is high or sleep is low, keep meals simpler, higher-fiber, and avoid late heavy dinners.
- If biggest obstacle is time, prefer batch-cookable meals and 15-25 minute options.
- If biggest obstacle is cravings, include satisfying high-protein snacks.
- If workout is early_morning or morning, make breakfast protein-forward. If workout is evening, make the evening snack useful pre-workout fuel.

Return JSON:
{
  "days": [
    {
      "day": 1,
      "breakfast": { "name": "Poha with peanuts", "calories": 450, "protein": 12, "carbs": 65, "fat": 14, "prep_time": "15 min" },
      "lunch": { "name": "Rajma chawal + salad", "calories": 650, "protein": 22, "carbs": 90, "fat": 16, "prep_time": "30 min" },
      "dinner": { "name": "Paneer tikka + 3 roti", "calories": 600, "protein": 28, "carbs": 55, "fat": 22, "prep_time": "25 min" },
      "snack": { "name": "Protein shake + banana", "calories": 300, "protein": 20, "carbs": 35, "fat": 8, "prep_time": "5 min" },
      "evening_snack": { "name": "Optional only for 5 meals", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "prep_time": "5 min" },
      "total_calories": ${calories}
    }
  ]
}

STRICT RULES:
- Each day's total calories MUST equal exactly ${calories} kcal (±30 max)
- Use ${mealCount} eating moments per day based on meal rhythm "${mealFrequency}".
- Distribute calories: ${distribution}
- Daily protein must be close to ${proteinTarget}g
- Don't repeat the same meal within 3 days
- For goal "${goal}": ${goal === 'lose' || goal === 'weight_loss' ? 'focus on high protein, moderate carbs, low fat' : goal === 'muscle' || goal === 'muscle_gain' ? 'focus on high protein, adequate carbs for energy' : 'balanced macros'}
- For ${dietType}: NO exceptions to dietary restrictions
- ${weight > targetWeight ? 'User wants to LOSE weight — keep portions controlled, high fiber' : weight < targetWeight ? 'User wants to GAIN weight — include calorie-dense nutritious foods' : 'Maintain current weight — balanced approach'}
- All values must be numbers
- 7 days total, with the eating moments matching "${mealFrequency}"
- For 2 meals, breakfast may be omitted or 0 calories. For 5 meals, include evening_snack.
- IMPORTANT: Verify all eating moment calories sum to ${calories} before responding`
}

async function generateMealPlan(profile) {
  const response = await getClient().chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: MEAL_PLAN_SYSTEM },
      { role: 'user', content: buildMealPlanPrompt(profile) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 8000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from AI')
  }

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error('[Meal Plan] JSON parse failed:', content.slice(0, 200))
    throw new Error('AI returned invalid response. Please try again.')
  }

  const days = parsed.days || parsed.plan?.days || parsed.meal_plan?.days || []
  if (!days.length) {
    throw new Error('AI did not return a valid meal plan. Please try again.')
  }

  const tokensUsed = response.usage?.total_tokens ?? 0
  return { plan: days, tokensUsed }
}

// ─── MEAL SUGGESTIONS ────────────────────────────────────────────────────────

const SUGGEST_SYSTEM = `You are a nutrition coach helping users pick their next meal.
Suggest practical Indian meals that fit within their remaining daily macros.
Consider the user's diet type, goal, and lifestyle when suggesting.
Return ONLY valid JSON, no markdown or extra text.`

function buildSuggestPrompt(remaining, mealType, dietType) {
  return `The user needs suggestions for ${mealType || 'their next meal'}.

Remaining macros for today:
- Calories: ${remaining.calories} kcal
- Protein: ${remaining.protein}g
- Carbs: ${remaining.carbs}g
- Fat: ${remaining.fat}g

Diet type: ${dietType || 'any'}
Meal type: ${mealType || 'any'}

Suggest exactly 3 Indian meals that fit within these remaining macros.
Each meal should be:
- Realistic and easy to prepare at home or order
- Appropriate for ${mealType} time
- Within the remaining calorie budget
- Prioritize hitting protein target

Return JSON:
{
  "suggestions": [
    {
      "name": "Meal name (specific, with quantity)",
      "calories": 380,
      "protein": 25,
      "carbs": 40,
      "fat": 12,
      "diet_type": "veg",
      "why": "Short reason why this fits (1 sentence)"
    }
  ]
}

Rules:
- Each suggestion's calories must be <= ${remaining.calories}
- Prioritize hitting protein target
- All values must be numbers
- Exactly 3 suggestions
- For ${dietType}: strictly follow dietary restrictions`
}

async function suggestMeals(remaining, mealType, dietType) {
  const response = await getClient().chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: SUGGEST_SYSTEM },
      { role: 'user', content: buildSuggestPrompt(remaining, mealType, dietType) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 800,
  })

  const content = response.choices[0]?.message?.content
  const parsed = JSON.parse(content)
  const tokensUsed = response.usage?.total_tokens ?? 0

  return { suggestions: parsed.suggestions || [], tokensUsed }
}

module.exports = { searchFood, generateMealPlan, suggestMeals }
