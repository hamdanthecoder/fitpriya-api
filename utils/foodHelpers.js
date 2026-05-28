function getDisplayName(food, language = 'en') {
  if (language === 'hi' && food.name?.hi && food.name.hi.trim().length > 0) {
    return food.name.hi
  }
  return food.name?.en || ''
}

const hindiNames = {
  // Breakfast
  "Poha": "पोहा", "Upma": "उपमा", "Idli": "इडली", "Dosa": "डोसा",
  "Masala Dosa": "मसाला डोसा", "Plain Dosa": "सादा डोसा", "Uttapam": "उत्तपम",
  "Rava Idli": "रवा इडली", "Medu Vada": "मेदू वड़ा", "Pongal": "पोंगल",
  "Aloo Paratha": "आलू पराठा", "Gobhi Paratha": "गोभी पराठा",
  "Methi Paratha": "मेथी पराठा", "Mooli Paratha": "मूली पराठा",
  "Plain Paratha": "सादा पराठा", "Besan Chilla": "बेसन चिल्ला",
  "Moong Dal Chilla": "मूंग दाल चिल्ला", "Daliya": "दलिया",
  "Oats Porridge": "ओट्स दलिया", "Sabudana Khichdi": "साबूदाना खिचड़ी",
  "Thepla": "थेपला", "Dhokla": "ढोकला", "Handvo": "हांडवो",
  "Thalipeeth": "थालीपीठ", "Missi Roti": "मिस्सी रोटी",
  "Egg Bhurji": "अंडा भुर्जी", "Boiled Eggs": "उबले अंडे",
  "Omelette": "ऑमलेट", "Sprouts Salad": "अंकुरित सलाद",
  "Fruit Bowl": "फ्रूट बाउल", "Poha Indori": "इंदौरी पोहा",
  "Akki Roti": "अक्की रोटी", "Puttu": "पुट्टू", "Appam": "अप्पम",
  "Idiyappam": "इडियप्पम",
  // Dal
  "Toor Dal": "तूर दाल", "Moong Dal": "मूंग दाल", "Masoor Dal": "मसूर दाल",
  "Chana Dal": "चना दाल", "Urad Dal": "उड़द दाल", "Rajma": "राजमा",
  "Chole": "छोले", "Dal Makhani": "दाल मखनी", "Dal Tadka": "दाल तड़का",
  "Dal Fry": "दाल फ्राई", "Sambar": "सांभर", "Rasam": "रसम", "Kadhi": "कढ़ी",
  // Rice
  "Plain Rice": "सफेद चावल", "Brown Rice": "ब्राउन राइस",
  "Chicken Biryani": "चिकन बिरयानी", "Mutton Biryani": "मटन बिरयानी",
  "Veg Biryani": "वेज बिरयानी", "Egg Biryani": "अंडा बिरयानी",
  "Pulao": "पुलाव", "Jeera Rice": "जीरा राइस", "Khichdi": "खिचड़ी",
  "Curd Rice": "दही चावल", "Lemon Rice": "नींबू राइस",
  "Tamarind Rice": "इमली राइस", "Bisi Bele Bath": "बिसी बेले भात",
  "Pongal Ven": "वेन पोंगल",
  // Roti
  "Roti": "रोटी", "Chapati": "चपाती", "Naan": "नान",
  "Butter Naan": "बटर नान", "Garlic Naan": "लहसुन नान",
  "Bhatura": "भटूरा", "Puri": "पूरी", "Bajra Roti": "बाजरे की रोटी",
  "Jowar Roti": "ज्वार की रोटी", "Ragi Roti": "रागी रोटी",
  "Makki Roti": "मक्के की रोटी", "Tandoori Roti": "तंदूरी रोटी",
  // Paneer
  "Palak Paneer": "पालक पनीर", "Shahi Paneer": "शाही पनीर",
  "Matar Paneer": "मटर पनीर", "Kadai Paneer": "कड़ाई पनीर",
  "Paneer Tikka": "पनीर टिक्का", "Paneer Bhurji": "पनीर भुर्जी",
  "Paneer Butter Masala": "पनीर बटर मसाला",
  // Sabzi
  "Aloo Gobi": "आलू गोभी", "Aloo Matar": "आलू मटर",
  "Baingan Bharta": "बैंगन भर्ता", "Bhindi": "भिंडी", "Lauki": "लौकी",
  "Karela": "करेला", "Methi Sabzi": "मेथी सब्जी", "Palak": "पालक",
  "Arbi": "अरबी", "Kaddu": "कद्दू", "Tinda": "टिंडा", "Turai": "तुरई",
  "Kathal": "कटहल", "Kela Sabzi": "केले की सब्जी", "Saag": "साग",
  "Sarson Saag": "सरसों का साग",
  // Chicken
  "Chicken Curry": "चिकन करी", "Butter Chicken": "बटर चिकन",
  "Chicken Tikka": "चिकन टिक्का", "Tandoori Chicken": "तंदूरी चिकन",
  "Chicken Keema": "चिकन कीमा", "Kadai Chicken": "कड़ाई चिकन",
  "Chicken 65": "चिकन 65", "Malai Tikka": "मलाई टिक्का",
  // Mutton
  "Mutton Curry": "मटन करी", "Mutton Rogan Josh": "मटन रोगन जोश",
  "Mutton Keema": "मटन कीमा", "Seekh Kebab": "सीख कबाब",
  "Shami Kebab": "शामी कबाब",
  // Egg / Fish
  "Egg Curry": "अंडा करी", "Egg Paratha": "अंडा पराठा",
  "Boiled Egg": "उबला अंडा", "Fish Curry": "मछली करी",
  "Fish Fry": "मछली फ्राई", "Prawn Curry": "झींगा करी",
  // Street food
  "Samosa": "समोसा", "Kachori": "कचोरी", "Vada Pav": "वड़ा पाव",
  "Pav Bhaji": "पाव भाजी", "Pani Puri": "पानी पूरी",
  "Bhel Puri": "भेल पूरी", "Aloo Tikki": "आलू टिक्की",
  "Dabeli": "दाबेली", "Misal Pav": "मिसल पाव",
  "Chole Bhature": "छोले भटूरे", "Raj Kachori": "राज कचोरी",
  "Dahi Puri": "दही पूरी", "Papdi Chaat": "पापड़ी चाट",
  // Snacks
  "Roasted Peanuts": "भुनी मूंगफली", "Roasted Makhana": "भुना मखाना",
  "Roasted Chana": "भुना चना", "Chakli": "चकली",
  "Bhakharwadi": "भाखरवड़ी", "Murmura": "मुरमुरा",
  // Beverages
  "Chai": "चाय", "Chai With Sugar": "चाय चीनी के साथ",
  "Chai No Sugar": "बिना चीनी चाय", "Masala Chai": "मसाला चाय",
  "Lassi Sweet": "मीठी लस्सी", "Lassi Salted": "नमकीन लस्सी",
  "Mango Lassi": "मैंगो लस्सी", "Buttermilk": "छाछ",
  "Coconut Water": "नारियल पानी", "Nimbu Pani": "नींबू पानी",
  "Sugarcane Juice": "गन्ने का रस", "Aam Panna": "आम पन्ना",
  // Fruits
  "Banana": "केला", "Apple": "सेब", "Mango": "आम", "Orange": "संतरा",
  "Guava": "अमरूद", "Papaya": "पपीता", "Watermelon": "तरबूज",
  "Grapes": "अंगूर", "Pomegranate": "अनार", "Coconut": "नारियल",
  "Lemon": "नींबू", "Pineapple": "अनानास", "Dates": "खजूर",
  "Fig": "अंजीर", "Jackfruit": "कटहल", "Custard Apple": "सीताफल",
  "Plum": "आलूबुखारा", "Peach": "आड़ू", "Pear": "नाशपाती", "Kiwi": "कीवी",
  // Vegetables
  "Potato": "आलू", "Tomato": "टमाटर", "Onion": "प्याज",
  "Garlic": "लहसुन", "Ginger": "अदरक", "Spinach": "पालक",
  "Cauliflower": "फूलगोभी", "Cabbage": "पत्तागोभी", "Carrot": "गाजर",
  "Peas": "मटर", "Bitter Gourd": "करेला", "Bottle Gourd": "लौकी",
  "Ridge Gourd": "तुरई", "Fenugreek": "मेथी", "Okra": "भिंडी",
  "Eggplant": "बैंगन", "Drumstick": "सहजन", "Raw Banana": "कच्चा केला",
  "Yam": "जिमीकंद", "Radish": "मूली", "Cucumber": "खीरा",
  "Pumpkin": "कद्दू", "Beans": "फलियां",
  // Nuts
  "Almonds": "बादाम", "Cashews": "काजू", "Peanuts": "मूंगफली",
  "Walnuts": "अखरोट", "Pistachios": "पिस्ता", "Makhana": "मखाना",
  "Raisins": "किशमिश", "Dried Figs": "सूखे अंजीर",
  // Dairy
  "Paneer": "पनीर", "Curd": "दही", "Ghee": "घी", "Milk": "दूध",
  "Khoa": "खोया", "Cream": "मलाई", "Raita": "रायता",
  // Sweets
  "Gulab Jamun": "गुलाब जामुन", "Rasgulla": "रसगुल्ला", "Kheer": "खीर",
  "Gajar Halwa": "गाजर का हलवा", "Sooji Halwa": "सूजी का हलवा",
  "Ladoo": "लड्डू", "Besan Ladoo": "बेसन लड्डू",
  "Boondi Ladoo": "बूंदी लड्डू", "Motichoor Ladoo": "मोतीचूर लड्डू",
  "Barfi": "बर्फी", "Kaju Katli": "काजू कतली", "Jalebi": "जलेबी",
  "Malpua": "मालपुआ", "Shahi Tukda": "शाही टुकड़ा", "Halwa": "हलवा",
  "Payasam": "पायसम", "Gujiya": "गुझिया", "Modak": "मोदक",
  // Grains
  "Wheat Flour": "गेहूं का आटा", "Rice Flour": "चावल का आटा",
  "Besan": "बेसन", "Ragi": "रागी", "Bajra": "बाजरा", "Jowar": "ज्वार",
  "Suji": "सूजी", "Maida": "मैदा", "Sabudana": "साबूदाना",
  // Condiments
  "Green Chutney": "हरी चटनी", "Tamarind Chutney": "इमली चटनी",
  "Mango Pickle": "आम का अचार", "Coconut Chutney": "नारियल चटनी",
  "Papad": "पापड़",
  // Indo-Chinese
  "Chicken Manchurian": "चिकन मंचूरियन", "Veg Manchurian": "वेज मंचूरियन",
  "Hakka Noodles": "हक्का नूडल्स", "Chow Mein": "चाउमीन",
  "Vegetable Spring Roll": "स्प्रिंग रोल", "Hot and Sour Soup": "हॉट एंड सॉर सूप",
  "Schezwan Fried Rice": "शेजवान फ्राइड राइस",
  "Masala Pizza": "मसाला पिज्जा", "Paneer Pizza": "पनीर पिज्जा",
  "Chicken Tikka Pizza": "चिकन टिक्का पिज्जा"
}

function detectDietType(name, ingredients = '') {
  const text = (name + ' ' + ingredients).toLowerCase()
  const nonVeg = ['chicken','beef','pork','mutton','fish','shrimp','prawn','lamb',
    'turkey','meat','bacon','ham','sausage','pepperoni','tuna','salmon',
    'anchovy','crab','lobster','squid','octopus','mince','keema','gosht','maach','mamsam']
  const egg = ['egg','eggs','omelette','mayonnaise','bhurji','anda']
  const vegan = ['vegan','plant based','plant-based','dairy free']
  const jain = ['jain','no onion','no garlic','without onion','without garlic']
  const fasting = ['fasting','vrat','upvas','navratri','ekadashi']
  if (nonVeg.some(k => text.includes(k))) return ['non-veg']
  if (egg.some(k => text.includes(k))) return ['egg', 'veg']
  if (jain.some(k => text.includes(k))) return ['jain', 'veg']
  if (fasting.some(k => text.includes(k))) return ['fasting', 'veg']
  if (vegan.some(k => text.includes(k))) return ['vegan', 'veg']
  return ['veg']
}

function detectMealType(name, category = '') {
  const text = (name + ' ' + category).toLowerCase()
  const types = []
  const breakfast = ['poha','upma','idli','dosa','paratha','oats','porridge',
    'cereal','toast','egg','pancake','waffle','muffin','croissant','daliya','thepla','breakfast']
  const lunch = ['biryani','rice','roti','dal','curry','thali','sabzi','pulao','lunch','khichdi']
  const dinner = ['soup','khichdi','dinner','idli','dosa','dal']
  const snack = ['chai','coffee','tea','juice','fruit','nuts','makhana','chana',
    'biscuit','chips','cookie','snack','drink','samosa','vada','bhel','puri','chaat']
  if (breakfast.some(k => text.includes(k))) types.push('breakfast')
  if (lunch.some(k => text.includes(k))) types.push('lunch')
  if (dinner.some(k => text.includes(k))) types.push('dinner')
  if (snack.some(k => text.includes(k))) types.push('snack')
  return types.length > 0 ? types : ['any']
}

function calcHealthRating(nutrition) {
  const n = nutrition || {}
  let score = 5
  if (n.protein > 20) score += 2
  else if (n.protein > 12) score += 1
  if (n.fiber > 8) score += 2
  else if (n.fiber > 4) score += 1
  if (n.calories < 100) score += 1
  if (n.calories > 600) score -= 1
  if (n.calories > 800) score -= 1
  if (n.fat > 30) score -= 1
  if (n.sugar > 20) score -= 1
  if (n.sugar > 30) score -= 1
  if (n.sodium > 1000) score -= 1
  return Math.min(10, Math.max(1, score))
}

function detectCuisine(name, tags = []) {
  const text = (name + ' ' + tags.join(' ')).toLowerCase()
  if (text.includes('manchurian') || text.includes('hakka') || text.includes('chowmein') ||
      text.includes('chow mein') || text.includes('spring roll') || text.includes('indo chinese'))
    return 'indo-chinese'
  if (text.includes('sushi') || text.includes('ramen') || text.includes('tempura') ||
      text.includes('teriyaki') || text.includes('miso') || text.includes('onigiri'))
    return 'japanese'
  if (text.includes('pizza') || text.includes('pasta') || text.includes('lasagna') ||
      text.includes('risotto') || text.includes('tiramisu'))
    return 'italian'
  if (text.includes('taco') || text.includes('burrito') || text.includes('quesadilla') ||
      text.includes('guacamole') || text.includes('nacho'))
    return 'mexican'
  if (text.includes('shawarma') || text.includes('falafel') || text.includes('hummus') ||
      text.includes('kebab') || text.includes('pita'))
    return 'middle-eastern'
  if (text.includes('burger') || text.includes('hot dog') || text.includes('pancake') || text.includes('waffle'))
    return 'american'
  if (text.includes('croissant') || text.includes('baguette') || text.includes('quiche') || text.includes('crepe'))
    return 'continental'
  if (text.includes('dal') || text.includes('roti') || text.includes('sabzi') ||
      text.includes('biryani') || text.includes('paneer') || text.includes('chai') ||
      text.includes('lassi') || text.includes('dosa') || text.includes('idli') ||
      text.includes('paratha') || text.includes('chaat') || text.includes('samosa'))
    return 'indian'
  return 'global'
}

function buildTags(name, categories = '') {
  const tags = []
  const text = (name + ' ' + categories).toLowerCase()
  if (text.includes('pizza')) tags.push('pizza', 'fast-food')
  if (text.includes('burger')) tags.push('burger', 'american', 'fast-food')
  if (text.includes('noodle') || text.includes('ramen')) tags.push('noodles', 'asian')
  if (text.includes('sushi')) tags.push('sushi', 'japanese', 'raw')
  if (text.includes('pasta')) tags.push('pasta', 'italian')
  if (text.includes('taco') || text.includes('burrito')) tags.push('mexican')
  if (text.includes('shawarma') || text.includes('falafel') || text.includes('hummus')) tags.push('middle-eastern')
  if (text.includes('manchurian') || text.includes('chowmein') || text.includes('chow mein')) tags.push('chinese', 'indo-chinese')
  if (text.includes('salad')) tags.push('healthy', 'low-calorie')
  if (text.includes('grilled')) tags.push('healthy', 'grilled')
  if (text.includes('soup')) tags.push('soup', 'light')
  if (text.includes('fried')) tags.push('fried', 'high-calorie')
  if (text.includes('masala') || text.includes('tikka') || text.includes('curry')) tags.push('indian', 'spicy')
  if (text.includes('dal') || text.includes('sabzi') || text.includes('roti')) tags.push('indian', 'traditional')
  if (text.includes('breakfast') || text.includes('cereal') || text.includes('oats')) tags.push('breakfast')
  if (text.includes('snack') || text.includes('chips') || text.includes('biscuit')) tags.push('snack', 'quick')
  if (text.includes('drink') || text.includes('juice') || text.includes('water')) tags.push('beverage', 'liquid')
  if (text.includes('chocolate') || text.includes('cake') || text.includes('sweet') || text.includes('dessert')) tags.push('dessert', 'sweet')
  if (text.includes('protein')) tags.push('high-protein', 'fitness')
  return [...new Set(tags)]
}

function getHindiName(englishName) {
  if (hindiNames[englishName]) return hindiNames[englishName]
  const lower = englishName.toLowerCase()
  for (const [key, val] of Object.entries(hindiNames)) {
    if (lower === key.toLowerCase()) return val
  }
  return ''
}

module.exports = {
  getDisplayName, hindiNames, getHindiName,
  detectDietType, detectMealType,
  calcHealthRating, detectCuisine, buildTags
}
