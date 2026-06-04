const OpenAI = require('openai')

const clientOptions = { apiKey: process.env.OPENAI_API_KEY }
if (process.env.OPENAI_BASE_URL) {
  clientOptions.baseURL = process.env.OPENAI_BASE_URL
}

const client = new OpenAI(clientOptions)
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

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

async function searchFood(query, dietType) {
  const response = await client.chat.completions.create({
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

  return { results: parsed.results || [], tokensUsed }
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
  const response = await client.chat.completions.create({
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
  const response = await client.chat.completions.create({
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
