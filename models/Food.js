const mongoose = require('mongoose')

const FoodSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, index: true },
    hi: { type: String, default: '' }
  },
  name_normalized: String,

  serving: {
    size: Number,
    unit: String,
    description: {
      en: { type: String, default: '100g' },
      hi: { type: String, default: '100 ग्राम' }
    }
  },

  nutrition: {
    calories:     { type: Number, default: 0 },
    protein:      { type: Number, default: 0 },
    carbs:        { type: Number, default: 0 },
    fat:          { type: Number, default: 0 },
    fiber:        { type: Number, default: 0 },
    sugar:        { type: Number, default: 0 },
    sodium:       { type: Number, default: 0 },
    iron:         { type: Number, default: 0 },
    calcium:      { type: Number, default: 0 },
    vitaminC:     { type: Number, default: 0 },
    vitaminA:     { type: Number, default: 0 },
    potassium:    { type: Number, default: 0 },
    magnesium:    { type: Number, default: 0 },
    zinc:         { type: Number, default: 0 },
    omega3:       { type: Number, default: 0 },
    cholesterol:  { type: Number, default: 0 },
    saturatedFat: { type: Number, default: 0 }
  },

  mealType: {
    type: [String],
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'any'],
    default: ['any']
  },

  dietType: {
    type: [String],
    enum: ['veg', 'non-veg', 'egg', 'vegan', 'jain', 'fasting'],
    default: ['veg']
  },

  region:      { type: [String], default: ['global'] },
  category:    String,
  subCategory: String,

  cuisine: {
    type: String,
    enum: ['indian', 'indo-chinese', 'chinese', 'italian', 'american',
           'mexican', 'japanese', 'middle-eastern', 'continental',
           'bakery', 'global', 'other'],
    default: 'global'
  },

  tags:    [String],
  barcode: { type: String, index: true, sparse: true },
  brand:   String,

  isIndian:      { type: Boolean, default: false },
  isGlobal:      { type: Boolean, default: false },
  isIndianStyle: { type: Boolean, default: false },

  healthRating:  { type: Number, min: 1, max: 10, default: 5 },
  glycemicIndex: Number,

  portionTip: {
    en: { type: String, default: '' },
    hi: { type: String, default: '' }
  },

  source: {
    type: String,
    enum: ['ifct2017', 'indb', 'indian_food', 'recipes',
           'openfoodfacts', 'usda_global', 'manual'],
    required: true
  },

  isVerified:  { type: Boolean, default: false },
  searchCount: { type: Number, default: 0 }

}, { timestamps: true, strict: false })

FoodSchema.index({ 'name.en': 'text', 'name.hi': 'text', tags: 'text', category: 'text', brand: 'text' })
FoodSchema.index({ 'nutrition.calories': 1, dietType: 1 })
FoodSchema.index({ mealType: 1, dietType: 1 })
FoodSchema.index({ cuisine: 1, isIndian: 1 })

module.exports = mongoose.model('Food', FoodSchema, 'foods')
