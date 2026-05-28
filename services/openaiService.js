const OpenAI = require('openai')

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
      "serving_description": "e.g. 2 roti + 1 bowl dal",
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
- "low" = rough estimate, actual may vary significantly`
}

async function searchFood(query, dietType) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
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
  const calories = profile.dailyCalories || 1800
  const dietType = profile.dietType || 'veg'
  const goal = profile.goal || 'maintain'
  const time = profile.availableTime || '30 min'

  return `Create a 7-day meal plan for this user:
- Daily calorie target: ${calories} kcal
- Diet type: ${dietType} (strictly follow this)
- Fitness goal: ${goal}
- Available cooking time: ${time}
- Cuisine preference: Indian (with some variety)

Return JSON:
{
  "days": [
    {
      "day": 1,
      "breakfast": { "name": "Poha with peanuts", "calories": 320, "protein": 8, "carbs": 52, "fat": 10, "prep_time": "15 min" },
      "lunch": { "name": "Rajma chawal + salad", "calories": 520, "protein": 18, "carbs": 78, "fat": 12, "prep_time": "30 min" },
      "dinner": { "name": "Paneer tikka + 2 roti", "calories": 450, "protein": 22, "carbs": 40, "fat": 18, "prep_time": "25 min" },
      "snack": { "name": "Fruit chaat", "calories": 150, "protein": 2, "carbs": 35, "fat": 1, "prep_time": "5 min" },
      "total_calories": 1440
    }
  ]
}

Rules:
- Each day's total_calories must be within ±100 of ${calories}
- Don't repeat the same meal within 3 days
- Include protein-rich options (goal: ${goal})
- All values must be numbers
- prep_time is a string like "15 min"
- For ${dietType}: NO exceptions to dietary restrictions
- 7 days total`
}

async function generateMealPlan(profile) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: MEAL_PLAN_SYSTEM },
      { role: 'user', content: buildMealPlanPrompt(profile) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 3000,
  })

  const content = response.choices[0]?.message?.content
  const parsed = JSON.parse(content)
  const tokensUsed = response.usage?.total_tokens ?? 0

  return { plan: parsed.days || parsed.plan?.days || [], tokensUsed }
}

// ─── MEAL SUGGESTIONS ────────────────────────────────────────────────────────

const SUGGEST_SYSTEM = `You are a nutrition coach helping users pick their next meal.
Suggest practical Indian meals that fit within their remaining daily macros.
Return ONLY valid JSON, no markdown or extra text.`

function buildSuggestPrompt(remaining, mealType, dietType) {
  return `The user needs suggestions for ${mealType || 'their next meal'}.

Remaining macros for today:
- Calories: ${remaining.calories} kcal
- Protein: ${remaining.protein}g
- Carbs: ${remaining.carbs}g
- Fat: ${remaining.fat}g

Diet type: ${dietType || 'any'}

Suggest exactly 3 Indian meals that fit within these remaining macros.
Each meal should be realistic and easy to prepare or order.

Return JSON:
{
  "suggestions": [
    {
      "name": "Meal name",
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
    model: 'gpt-4o-mini',
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
