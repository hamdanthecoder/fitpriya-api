// 150 personalized habit challenges
// goals: weight_loss | muscle_gain | general_health | improve_fitness | mental_wellness | flexibility | stress_relief
// levels: beginner | intermediate | advanced | all
// categories: hydration | nutrition | movement | sleep | mental | productivity | recovery | yoga | fasting | morning | social

const ALL_HABITS = [
  // ── HYDRATION (10) ──────────────────────────────────────────────────────────
  { id: 'h001', icon: '💧', text: 'Drink a full glass of water right after waking up', pts: 5,  category: 'hydration', goals: ['all'], levels: ['all'] },
  { id: 'h002', icon: '🥤', text: 'Carry a 1L bottle and finish it before lunch', pts: 10, category: 'hydration', goals: ['all'], levels: ['all'] },
  { id: 'h003', icon: '🍋', text: 'Add lemon to your morning water — vitamin C boost', pts: 5,  category: 'hydration', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'h004', icon: '💧', text: 'Drink a glass of water before every meal today (3x)', pts: 10, category: 'hydration', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'h005', icon: '🍵', text: 'Replace one coffee with green tea today', pts: 10, category: 'hydration', goals: ['weight_loss', 'mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'h006', icon: '🌿', text: 'Try chamomile or peppermint herbal tea this evening', pts: 5,  category: 'hydration', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'h007', icon: '💧', text: 'Set hourly water alarms and hit 2.5L today', pts: 15, category: 'hydration', goals: ['all'], levels: ['all'] },
  { id: 'h008', icon: '🥒', text: 'Eat water-rich foods: cucumber, watermelon, or celery', pts: 10, category: 'hydration', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'h009', icon: '🫖', text: 'Make haldi doodh (golden milk) tonight before bed', pts: 10, category: 'hydration', goals: ['general_health', 'mental_wellness'], levels: ['all'] },
  { id: 'h010', icon: '🧊', text: 'Drink only water today — zero sugary drinks', pts: 15, category: 'hydration', goals: ['weight_loss', 'general_health', 'improve_fitness'], levels: ['all'] },
  { id: 'h011', icon: '💧', text: 'Drink 500 ml water during your workout or walk today', pts: 10, category: 'hydration', goals: ['improve_fitness', 'muscle_gain', 'weight_loss'], levels: ['all'] },
  { id: 'h012', icon: '🥤', text: 'Keep water visible on your desk for the next 4 hours', pts: 5, category: 'hydration', goals: ['all'], levels: ['all'] },
  { id: 'h013', icon: '🧂', text: 'After sweating, add lemon and a tiny pinch of salt to water', pts: 10, category: 'hydration', goals: ['improve_fitness', 'general_health'], levels: ['intermediate', 'advanced'] },
  { id: 'h014', icon: '🍉', text: 'Choose fruit or chaas instead of a cold drink today', pts: 10, category: 'hydration', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'h015', icon: '📱', text: 'Log every glass of water in FitPriya today', pts: 10, category: 'hydration', goals: ['all'], levels: ['all'] },

  // ── NUTRITION (15) ──────────────────────────────────────────────────────────
  { id: 'n001', icon: '🥗', text: 'Fill half your plate with sabzi/vegetables at lunch', pts: 15, category: 'nutrition', goals: ['weight_loss', 'general_health', 'improve_fitness'], levels: ['all'] },
  { id: 'n002', icon: '🍎', text: 'Eat a fresh fruit instead of a biscuit or packaged snack', pts: 10, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n003', icon: '🥚', text: 'Eat a protein-rich breakfast: eggs, dahi, paneer, or sprouts', pts: 15, category: 'nutrition', goals: ['muscle_gain', 'weight_loss', 'improve_fitness'], levels: ['all'] },
  { id: 'n004', icon: '🚫', text: 'No junk food, fried food, or mithai today — stay clean', pts: 20, category: 'nutrition', goals: ['weight_loss', 'general_health', 'improve_fitness'], levels: ['all'] },
  { id: 'n005', icon: '🌾', text: 'Choose atta roti over maida, brown rice over white', pts: 15, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n006', icon: '🧈', text: 'Add healthy fats: handful of nuts, seeds, or a spoon of ghee', pts: 10, category: 'nutrition', goals: ['general_health', 'muscle_gain'], levels: ['all'] },
  { id: 'n007', icon: '⏰', text: 'Finish dinner before 7:30 PM tonight', pts: 15, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n008', icon: '🍽️', text: 'Eat slowly — put your spoon down between bites', pts: 10, category: 'nutrition', goals: ['weight_loss', 'general_health', 'mental_wellness'], levels: ['all'] },
  { id: 'n009', icon: '📏', text: 'Use a smaller plate and avoid going back for seconds', pts: 15, category: 'nutrition', goals: ['weight_loss'], levels: ['all'] },
  { id: 'n010', icon: '🥜', text: 'Snack on a handful of almonds or walnuts instead of chips', pts: 10, category: 'nutrition', goals: ['muscle_gain', 'general_health', 'weight_loss'], levels: ['all'] },
  { id: 'n011', icon: '🍳', text: 'Cook all your meals at home today — no outside food', pts: 20, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n012', icon: '🌙', text: 'No eating after 9 PM — kitchen is closed!', pts: 15, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n013', icon: '🥛', text: 'Have a glass of dahi or milk with your dinner', pts: 10, category: 'nutrition', goals: ['muscle_gain', 'general_health'], levels: ['all'] },
  { id: 'n014', icon: '🫘', text: 'Add dal, rajma, or chana to one meal today for protein', pts: 10, category: 'nutrition', goals: ['weight_loss', 'muscle_gain', 'general_health'], levels: ['all'] },
  { id: 'n015', icon: '🌱', text: 'Add a handful of sprouts to your breakfast or salad', pts: 10, category: 'nutrition', goals: ['weight_loss', 'muscle_gain', 'general_health'], levels: ['all'] },
  { id: 'n016', icon: '🍳', text: 'Add 20g+ protein to breakfast: eggs, paneer, tofu, or dal', pts: 15, category: 'nutrition', goals: ['muscle_gain', 'weight_loss', 'improve_fitness'], levels: ['all'] },
  { id: 'n017', icon: '🥣', text: 'Eat one bowl of curd with lunch for digestion and protein', pts: 10, category: 'nutrition', goals: ['general_health', 'muscle_gain'], levels: ['all'] },
  { id: 'n018', icon: '🥗', text: 'Start lunch with salad before rice or roti', pts: 10, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n019', icon: '🧂', text: 'Avoid extra salt and namkeen snacks today', pts: 10, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n020', icon: '🍛', text: 'Build one balanced plate: protein, sabzi, carb, and curd', pts: 15, category: 'nutrition', goals: ['all'], levels: ['all'] },
  { id: 'n021', icon: '📦', text: 'Read one packaged food label before eating it', pts: 10, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'n022', icon: '🥜', text: 'Prepare a healthy snack box for tomorrow', pts: 10, category: 'nutrition', goals: ['weight_loss', 'muscle_gain', 'general_health'], levels: ['all'] },
  { id: 'n023', icon: '🍚', text: 'Keep rice to one measured bowl at one meal today', pts: 10, category: 'nutrition', goals: ['weight_loss'], levels: ['all'] },
  { id: 'n024', icon: '🥛', text: 'Add one protein drink, lassi, or milk if calories are low today', pts: 10, category: 'nutrition', goals: ['muscle_gain'], levels: ['all'] },
  { id: 'n025', icon: '📝', text: 'Log your dinner before eating so portions stay intentional', pts: 15, category: 'nutrition', goals: ['weight_loss', 'general_health'], levels: ['all'] },

  // ── MOVEMENT & EXERCISE (15) ────────────────────────────────────────────────
  { id: 'm001', icon: '🚶', text: 'Walk 10,000 steps today — track on your phone', pts: 20, category: 'movement', goals: ['weight_loss', 'general_health', 'improve_fitness'], levels: ['all'] },
  { id: 'm002', icon: '🏃', text: 'Take a brisk 20-minute walk after dinner', pts: 15, category: 'movement', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'm003', icon: '🚶', text: 'Take the stairs every time today — no lifts!', pts: 10, category: 'movement', goals: ['weight_loss', 'general_health', 'improve_fitness'], levels: ['beginner', 'intermediate'] },
  { id: 'm004', icon: '🤸', text: 'Do a 15-minute morning full-body stretch', pts: 15, category: 'movement', goals: ['flexibility', 'general_health', 'mental_wellness'], levels: ['all'] },
  { id: 'm005', icon: '💪', text: 'Do 3 sets of 15 bodyweight squats right now', pts: 15, category: 'movement', goals: ['muscle_gain', 'weight_loss', 'improve_fitness'], levels: ['beginner', 'intermediate'] },
  { id: 'm006', icon: '🏋️', text: 'Add 5 more reps to every set in today\'s workout', pts: 15, category: 'movement', goals: ['muscle_gain', 'improve_fitness'], levels: ['intermediate', 'advanced'] },
  { id: 'm007', icon: '🚴', text: 'Do 20 minutes of cycling, running, or HIIT cardio', pts: 20, category: 'movement', goals: ['weight_loss', 'improve_fitness'], levels: ['all'] },
  { id: 'm008', icon: '🤼', text: 'Do 10 push-ups + 10 sit-ups + 10 squats for 3 rounds', pts: 20, category: 'movement', goals: ['muscle_gain', 'improve_fitness', 'weight_loss'], levels: ['beginner', 'intermediate'] },
  { id: 'm009', icon: '⏱️', text: 'Hold a plank for 60 seconds — core strength challenge!', pts: 15, category: 'movement', goals: ['muscle_gain', 'improve_fitness'], levels: ['intermediate', 'advanced'] },
  { id: 'm010', icon: '🎽', text: 'Warm up for 10 minutes before your workout today', pts: 10, category: 'movement', goals: ['improve_fitness', 'muscle_gain', 'weight_loss'], levels: ['all'] },
  { id: 'm011', icon: '🌟', text: 'Try a new exercise you\'ve never done before', pts: 15, category: 'movement', goals: ['improve_fitness', 'general_health'], levels: ['all'] },
  { id: 'm012', icon: '🫀', text: 'Do 100 jumping jacks spread throughout the day', pts: 15, category: 'movement', goals: ['weight_loss', 'improve_fitness'], levels: ['beginner', 'intermediate'] },
  { id: 'm013', icon: '💃', text: 'Dance for 15 minutes to your favourite songs', pts: 15, category: 'movement', goals: ['weight_loss', 'general_health', 'mental_wellness'], levels: ['all'] },
  { id: 'm014', icon: '🧗', text: 'Do a 45-minute outdoor workout — park, trail, or ground', pts: 20, category: 'movement', goals: ['improve_fitness', 'general_health', 'weight_loss'], levels: ['intermediate', 'advanced'] },
  { id: 'm015', icon: '🦵', text: 'Do 3 sets of lunges and glute bridges after waking', pts: 10, category: 'movement', goals: ['muscle_gain', 'weight_loss', 'improve_fitness'], levels: ['beginner', 'intermediate'] },
  { id: 'm016', icon: '🚶', text: 'Take a 5-minute walk after each main meal today', pts: 15, category: 'movement', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'm017', icon: '🪑', text: 'Do 3 sets of 12 chair squats with slow control', pts: 10, category: 'movement', goals: ['general_health', 'improve_fitness'], levels: ['beginner'] },
  { id: 'm018', icon: '💪', text: 'Do 3 sets of incline push-ups on a table or wall', pts: 10, category: 'movement', goals: ['muscle_gain', 'improve_fitness'], levels: ['beginner'] },
  { id: 'm019', icon: '⏱️', text: 'Do a 12-minute EMOM: squats, push-ups, plank, rest', pts: 20, category: 'movement', goals: ['improve_fitness', 'weight_loss'], levels: ['intermediate', 'advanced'] },
  { id: 'm020', icon: '🧍', text: 'Stand for 10 minutes every hour during work today', pts: 10, category: 'movement', goals: ['general_health', 'weight_loss'], levels: ['all'] },
  { id: 'm021', icon: '🦶', text: 'Do 50 calf raises while brushing or waiting', pts: 10, category: 'movement', goals: ['improve_fitness', 'general_health'], levels: ['all'] },
  { id: 'm022', icon: '🧘', text: 'Hold a deep squat for 2 minutes total today', pts: 10, category: 'movement', goals: ['flexibility', 'improve_fitness'], levels: ['all'] },
  { id: 'm023', icon: '🏃', text: 'Add 6 short 20-second fast intervals to your walk', pts: 15, category: 'movement', goals: ['weight_loss', 'improve_fitness'], levels: ['intermediate', 'advanced'] },
  { id: 'm024', icon: '🎒', text: 'Walk with light backpack weight for 15 minutes', pts: 15, category: 'movement', goals: ['improve_fitness', 'muscle_gain'], levels: ['intermediate', 'advanced'] },
  { id: 'm025', icon: '🧹', text: 'Do 20 minutes of active housework without long breaks', pts: 10, category: 'movement', goals: ['general_health', 'weight_loss'], levels: ['all'] },

  // ── SLEEP & RECOVERY (10) ───────────────────────────────────────────────────
  { id: 's001', icon: '💤', text: 'Be in bed by 10:30 PM for 7+ hours of sleep', pts: 20, category: 'sleep', goals: ['all'], levels: ['all'] },
  { id: 's002', icon: '🌙', text: 'No screens — phone, TV, laptop — 1 hour before bed', pts: 15, category: 'sleep', goals: ['all'], levels: ['all'] },
  { id: 's003', icon: '📵', text: 'Put your phone on DND at 10 PM and don\'t touch it', pts: 15, category: 'sleep', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 's004', icon: '🛁', text: 'Take a warm shower before bed for deeper sleep', pts: 10, category: 'sleep', goals: ['all'], levels: ['all'] },
  { id: 's005', icon: '📖', text: 'Read a physical book for 20 minutes before bed', pts: 10, category: 'sleep', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 's006', icon: '😴', text: 'Take a 20-minute power nap if you feel low energy', pts: 10, category: 'sleep', goals: ['general_health', 'improve_fitness', 'muscle_gain'], levels: ['all'] },
  { id: 's007', icon: '🧘', text: 'Do a 5-minute body scan meditation before sleeping', pts: 10, category: 'sleep', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 's008', icon: '⏰', text: 'Wake up at the exact same time as yesterday', pts: 10, category: 'sleep', goals: ['all'], levels: ['all'] },
  { id: 's009', icon: '🌅', text: 'Get bright natural sunlight in your first hour awake', pts: 15, category: 'sleep', goals: ['general_health', 'mental_wellness'], levels: ['all'] },
  { id: 's010', icon: '🍵', text: 'Drink ashwagandha milk or chamomile tea 30 min before bed', pts: 10, category: 'sleep', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 's011', icon: '🌡️', text: 'Keep your room cool and dark before sleeping', pts: 10, category: 'sleep', goals: ['general_health', 'mental_wellness'], levels: ['all'] },
  { id: 's012', icon: '🧺', text: 'Prepare clothes and water bottle tonight for tomorrow', pts: 10, category: 'sleep', goals: ['all'], levels: ['all'] },
  { id: 's013', icon: '☕', text: 'No caffeine after 3 PM today', pts: 15, category: 'sleep', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 's014', icon: '📝', text: 'Write tomorrow\'s top 3 tasks before bed to clear your mind', pts: 10, category: 'sleep', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 's015', icon: '🛌', text: 'Get into bed 15 minutes earlier than usual tonight', pts: 10, category: 'sleep', goals: ['all'], levels: ['all'] },

  // ── MENTAL HEALTH & MINDFULNESS (15) ────────────────────────────────────────
  { id: 'mh01', icon: '🧘', text: 'Meditate for 10 minutes in the morning before anything else', pts: 15, category: 'mental', goals: ['mental_wellness', 'stress_relief', 'general_health'], levels: ['all'] },
  { id: 'mh02', icon: '🙏', text: 'Write 3 things you are genuinely grateful for today', pts: 10, category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh03', icon: '📝', text: 'Journal for 5 minutes — no rules, just write how you feel', pts: 10, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh04', icon: '🌬️', text: 'Practice Anulom Vilom or box breathing for 5 minutes', pts: 15, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh05', icon: '📵', text: 'No social media before 9 AM — start the day with yourself', pts: 15, category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh06', icon: '💬', text: 'Call a friend or family member you haven\'t spoken to recently', pts: 10, category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh07', icon: '🌳', text: 'Spend 15 minutes outside in nature — park, garden, or balcony', pts: 15, category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh08', icon: '😊', text: 'Compliment or encourage 3 people today', pts: 5,  category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh09', icon: '🎵', text: 'Listen to calming music or bhajans for 15 minutes', pts: 5,  category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh10', icon: '🎨', text: 'Do something creative for 20 minutes: draw, cook, write', pts: 10, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh11', icon: '🚫', text: 'Say "no" to one commitment that drains your energy today', pts: 15, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh12', icon: '🌟', text: 'Repeat your health affirmation 10 times in the mirror', pts: 5,  category: 'mental', goals: ['mental_wellness', 'improve_fitness'], levels: ['all'] },
  { id: 'mh13', icon: '📚', text: 'Read 15 minutes of a self-improvement or health book', pts: 10, category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh14', icon: '🧠', text: 'Do a digital detox for 2 hours this afternoon', pts: 15, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh15', icon: '💆', text: 'Give yourself a 5-minute head or shoulder massage', pts: 10, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh16', icon: '🌬️', text: 'Do 10 slow breaths before opening any social app', pts: 10, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh17', icon: '📝', text: 'Write one worry and one action you can take today', pts: 10, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mh18', icon: '🔕', text: 'Put your phone away during one full meal', pts: 10, category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh19', icon: '🙂', text: 'Spend 5 minutes noticing what already went well today', pts: 5, category: 'mental', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'mh20', icon: '🚶', text: 'Take a quiet walk with no music or phone for 10 minutes', pts: 10, category: 'mental', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },

  // ── PRODUCTIVITY & PLANNING (10) ────────────────────────────────────────────
  { id: 'p001', icon: '📝', text: 'Write your top 3 health priorities for tomorrow before bed', pts: 10, category: 'productivity', goals: ['all'], levels: ['all'] },
  { id: 'p002', icon: '⏰', text: 'Wake up 30 minutes earlier than usual tomorrow', pts: 15, category: 'productivity', goals: ['general_health', 'improve_fitness'], levels: ['all'] },
  { id: 'p003', icon: '🗓️', text: 'Plan all your meals for tomorrow right now', pts: 15, category: 'productivity', goals: ['weight_loss', 'general_health', 'muscle_gain'], levels: ['all'] },
  { id: 'p004', icon: '🧹', text: 'Declutter one space for 10 minutes — clean space, clean mind', pts: 10, category: 'productivity', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'p005', icon: '✅', text: 'Complete your workout in the morning before any other task', pts: 20, category: 'productivity', goals: ['improve_fitness', 'weight_loss', 'muscle_gain'], levels: ['all'] },
  { id: 'p006', icon: '🎯', text: 'Set one measurable fitness goal for this week', pts: 10, category: 'productivity', goals: ['improve_fitness', 'weight_loss', 'muscle_gain'], levels: ['all'] },
  { id: 'p007', icon: '📊', text: 'Log every meal and workout in FitPriya today', pts: 15, category: 'productivity', goals: ['weight_loss', 'general_health', 'muscle_gain'], levels: ['all'] },
  { id: 'p008', icon: '💡', text: 'Learn one new nutrition or fitness fact today', pts: 5,  category: 'productivity', goals: ['all'], levels: ['all'] },
  { id: 'p009', icon: '🔋', text: 'Find your peak energy time today and schedule workout then', pts: 10, category: 'productivity', goals: ['improve_fitness', 'general_health'], levels: ['all'] },
  { id: 'p010', icon: '📸', text: 'Take a progress photo today and compare to last week', pts: 10, category: 'productivity', goals: ['weight_loss', 'muscle_gain', 'improve_fitness'], levels: ['all'] },

  // ── RECOVERY & COLD EXPOSURE (5) ────────────────────────────────────────────
  { id: 'r001', icon: '🧊', text: 'End your shower with 30 seconds of cold water', pts: 15, category: 'recovery', goals: ['improve_fitness', 'general_health', 'muscle_gain'], levels: ['intermediate', 'advanced'] },
  { id: 'r002', icon: '🧴', text: 'Use a foam roller for 10 minutes post-workout', pts: 10, category: 'recovery', goals: ['muscle_gain', 'improve_fitness', 'flexibility'], levels: ['intermediate', 'advanced'] },
  { id: 'r003', icon: '🌊', text: 'Contrast shower: hot 30s → cold 30s, repeat 5 times', pts: 15, category: 'recovery', goals: ['improve_fitness', 'general_health'], levels: ['intermediate', 'advanced'] },
  { id: 'r004', icon: '😌', text: 'Schedule a full rest day and honour it — recovery is training', pts: 15, category: 'recovery', goals: ['muscle_gain', 'improve_fitness'], levels: ['all'] },
  { id: 'r005', icon: '🛏️', text: 'Do light stretching for 10 minutes as active recovery', pts: 10, category: 'recovery', goals: ['muscle_gain', 'improve_fitness', 'flexibility'], levels: ['all'] },
  { id: 'r006', icon: '🦵', text: 'Stretch calves, quads, and hamstrings after your workout', pts: 10, category: 'recovery', goals: ['improve_fitness', 'muscle_gain', 'flexibility'], levels: ['all'] },
  { id: 'r007', icon: '🧘', text: 'Do 5 minutes of nasal breathing after training', pts: 10, category: 'recovery', goals: ['improve_fitness', 'mental_wellness'], levels: ['all'] },
  { id: 'r008', icon: '🧴', text: 'Massage sore muscles for 5 minutes with slow pressure', pts: 10, category: 'recovery', goals: ['muscle_gain', 'improve_fitness'], levels: ['all'] },
  { id: 'r009', icon: '📉', text: 'Keep today\'s workout light if your body feels unusually tired', pts: 10, category: 'recovery', goals: ['general_health', 'improve_fitness'], levels: ['all'] },
  { id: 'r010', icon: '🍽️', text: 'Eat a protein-rich recovery meal within 2 hours after training', pts: 15, category: 'recovery', goals: ['muscle_gain', 'improve_fitness'], levels: ['all'] },

  // ── YOGA & FLEXIBILITY (10) ─────────────────────────────────────────────────
  { id: 'y001', icon: '🧘', text: 'Do 5 rounds of Surya Namaskar (Sun Salutation)', pts: 20, category: 'yoga', goals: ['flexibility', 'general_health', 'weight_loss'], levels: ['all'] },
  { id: 'y002', icon: '🦵', text: 'Hold each stretch for 45 seconds — deep flexibility work', pts: 10, category: 'yoga', goals: ['flexibility', 'general_health'], levels: ['all'] },
  { id: 'y003', icon: '🧘', text: 'Try Yin yoga for 20 minutes — slow and deep poses', pts: 15, category: 'yoga', goals: ['flexibility', 'mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'y004', icon: '🌬️', text: 'Practice Kapalbhati pranayama for 5 minutes', pts: 15, category: 'yoga', goals: ['mental_wellness', 'stress_relief', 'general_health', 'weight_loss'], levels: ['all'] },
  { id: 'y005', icon: '🦶', text: 'Walk barefoot on grass for 10 minutes — earthing/grounding', pts: 10, category: 'yoga', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'y006', icon: '🧘', text: 'Do a complete 30-minute yoga flow session', pts: 20, category: 'yoga', goals: ['flexibility', 'mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'y007', icon: '🌙', text: 'Do a 10-minute bedtime yoga routine for deep sleep', pts: 10, category: 'yoga', goals: ['flexibility', 'mental_wellness'], levels: ['all'] },
  { id: 'y008', icon: '🤸', text: 'Work on hip flexors and hamstrings for 15 minutes', pts: 15, category: 'yoga', goals: ['flexibility'], levels: ['intermediate', 'advanced'] },
  { id: 'y009', icon: '🧘', text: 'Meditate in a comfortable seated position for 15 minutes', pts: 15, category: 'yoga', goals: ['mental_wellness', 'stress_relief', 'flexibility'], levels: ['all'] },
  { id: 'y010', icon: '🌿', text: 'Do cat-cow, child pose, and pigeon pose sequence', pts: 10, category: 'yoga', goals: ['flexibility', 'general_health', 'stress_relief'], levels: ['all'] },

  // ── INTERMITTENT FASTING (5) ─────────────────────────────────────────────────
  { id: 'f001', icon: '⏱️', text: 'Try a 14-hour fast: stop eating at 8 PM, eat at 10 AM', pts: 20, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['intermediate', 'advanced'] },
  { id: 'f002', icon: '🍵', text: 'Drink only water and herbal tea before 12 PM today', pts: 15, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['intermediate', 'advanced'] },
  { id: 'f003', icon: '🍽️', text: 'Eat only within an 8-hour window today (16:8 IF)', pts: 20, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['intermediate', 'advanced'] },
  { id: 'f004', icon: '🌿', text: 'Have warm jeera/ajwain water on empty stomach in morning', pts: 10, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'f005', icon: '🥤', text: 'Skip the evening snack — let your gut rest', pts: 15, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['intermediate', 'advanced'] },
  { id: 'f006', icon: '⏰', text: 'Keep a 12-hour overnight food gap today', pts: 10, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['beginner', 'intermediate'] },
  { id: 'f007', icon: '🍽️', text: 'Close your eating window 2 hours before bedtime', pts: 10, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'f008', icon: '🥤', text: 'Break your fast with protein, not sweets or fried food', pts: 15, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'f009', icon: '📝', text: 'Write your fasting start and end time before beginning', pts: 10, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['all'] },
  { id: 'f010', icon: '🌿', text: 'Keep fasting gentle today: stop if you feel dizzy or unwell', pts: 5, category: 'fasting', goals: ['weight_loss', 'general_health'], levels: ['all'] },

  // ── MORNING ROUTINES (5) ─────────────────────────────────────────────────────
  { id: 'mr01', icon: '🌅', text: 'Complete a 5-step morning routine before touching your phone', pts: 20, category: 'morning', goals: ['all'], levels: ['all'] },
  { id: 'mr02', icon: '🪥', text: 'Oil pull with coconut or sesame oil for 5 minutes', pts: 10, category: 'morning', goals: ['general_health'], levels: ['all'] },
  { id: 'mr03', icon: '📓', text: 'Write 3 morning pages — uncensored stream of thought', pts: 10, category: 'morning', goals: ['mental_wellness', 'stress_relief'], levels: ['all'] },
  { id: 'mr04', icon: '💪', text: 'Exercise before breakfast — fasted cardio or gym', pts: 20, category: 'morning', goals: ['weight_loss', 'improve_fitness', 'muscle_gain'], levels: ['all'] },
  { id: 'mr05', icon: '🌞', text: 'Visualize your strongest, healthiest self for 5 minutes', pts: 10, category: 'morning', goals: ['mental_wellness', 'general_health'], levels: ['all'] },

  // ── SOCIAL & ACCOUNTABILITY (5) ──────────────────────────────────────────────
  { id: 'so01', icon: '👥', text: 'Invite a friend to work out together today', pts: 20, category: 'social', goals: ['improve_fitness', 'weight_loss', 'muscle_gain'], levels: ['all'] },
  { id: 'so02', icon: '💬', text: 'Share your health win of the day with someone you trust', pts: 5,  category: 'social', goals: ['all'], levels: ['all'] },
  { id: 'so03', icon: '👨‍👩‍👧', text: 'Cook a healthy meal for your family or housemates', pts: 15, category: 'social', goals: ['general_health', 'weight_loss'], levels: ['all'] },
  { id: 'so04', icon: '📣', text: 'Encourage someone else on their fitness journey today', pts: 5,  category: 'social', goals: ['mental_wellness', 'general_health'], levels: ['all'] },
  { id: 'so05', icon: '🤝', text: 'Find an online fitness community and engage today', pts: 10, category: 'social', goals: ['improve_fitness', 'general_health'], levels: ['all'] },
];

// Map user goal strings to internal tags
const GOAL_MAP = {
  'lose weight': 'weight_loss',
  'weight loss': 'weight_loss',
  'lose_weight': 'weight_loss',
  'build muscle': 'muscle_gain',
  'muscle gain': 'muscle_gain',
  'muscle_gain': 'muscle_gain',
  'improve fitness': 'improve_fitness',
  'improve_fitness': 'improve_fitness',
  'get fit': 'improve_fitness',
  'stay healthy': 'general_health',
  'general health': 'general_health',
  'general_health': 'general_health',
  'mental wellness': 'mental_wellness',
  'mental_wellness': 'mental_wellness',
  'reduce stress': 'stress_relief',
  'flexibility': 'flexibility',
  'be more flexible': 'flexibility',
};

const LEVEL_MAP = {
  'beginner':     'beginner',
  'intermediate': 'intermediate',
  'advanced':     'advanced',
  'very active':  'advanced',
  'moderately active': 'intermediate',
  'lightly active': 'beginner',
  'sedentary':    'beginner',
};

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function filterHabits(profile) {
  const goalKey   = GOAL_MAP[(profile.goal || '').toLowerCase()] || 'general_health';
  const levelKey  = LEVEL_MAP[(profile.fitnessLevel || '').toLowerCase()] ||
                    LEVEL_MAP[(profile.activityLevel || '').toLowerCase()] || 'beginner';

  // Focus area bonus categories
  const focusCategories = new Set();
  (profile.focusAreas || []).forEach(f => {
    const fl = f.toLowerCase();
    if (fl.includes('mental') || fl.includes('mind') || fl.includes('stress')) focusCategories.add('mental');
    if (fl.includes('yoga') || fl.includes('flex')) { focusCategories.add('yoga'); focusCategories.add('recovery'); }
    if (fl.includes('weight') || fl.includes('diet') || fl.includes('nutrition')) focusCategories.add('nutrition');
    if (fl.includes('muscle') || fl.includes('strength')) focusCategories.add('movement');
    if (fl.includes('cardio') || fl.includes('endurance')) focusCategories.add('movement');
  });

  return ALL_HABITS.filter(h => {
    const goalMatch  = h.goals.includes('all') || h.goals.includes(goalKey);
    const levelMatch = h.levels.includes('all') || h.levels.includes(levelKey) ||
                       (levelKey === 'advanced' && h.levels.includes('intermediate'));
    return goalMatch && levelMatch;
  }).map(h => ({
    ...h,
    // boost score for focus-area matches so they appear more often
    _score: focusCategories.has(h.category) ? 2 : 1,
  }));
}

function getPersonalisedHabits(uid, profile, count = 5) {
  const filtered = filterHabits(profile);
  if (!filtered.length) return ALL_HABITS.slice(0, count);

  const day     = getDayOfYear();
  const seed    = hashStr(uid);
  const focus   = filtered.filter(h => h._score > 1);
  const regular = filtered.filter(h => h._score === 1);
  const focusTarget = Math.min(2, count, focus.length);

  const result = [];
  const used = new Set();

  function addFrom(pool, target, offset) {
    if (!pool.length) return;
    const start = (day * 7 + seed + offset) % pool.length;
    for (let i = 0; i < pool.length && result.length < target; i++) {
      const habit = pool[(start + i) % pool.length];
      if (used.has(habit.id)) continue;
      used.add(habit.id);
      result.push({ id: habit.id, icon: habit.icon, text: habit.text, pts: habit.pts, category: habit.category });
    }
  }

  addFrom(focus, focusTarget, 0);
  addFrom([...regular, ...focus], count, focusTarget * 13);
  return result;
}

module.exports = { getPersonalisedHabits, ALL_HABITS };
