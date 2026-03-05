// ============================================================
// COMPREHENSIVE MUSCLE & EXERCISE DATABASE
// Structured for searchable use in the member portal
// ============================================================

// ----- MUSCLE GROUPS -----

export interface MuscleGroup {
  id: string;
  name: string;
  aliases: string[];       // common gym names / abbreviations
  parentId?: string;       // links sub-groups to their parent
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  // --- Major Groups ---
  { id: 'chest',        name: 'Chest',        aliases: ['pecs', 'pectorals', 'pec'] },
  { id: 'back',         name: 'Back',         aliases: ['dorsal', 'posterior chain'] },
  { id: 'shoulders',    name: 'Shoulders',    aliases: ['delts', 'deltoids'] },
  { id: 'biceps',       name: 'Biceps',       aliases: ['bis', 'guns', 'bicep'] },
  { id: 'triceps',      name: 'Triceps',      aliases: ['tris', 'tricep'] },
  { id: 'forearms',     name: 'Forearms',     aliases: ['wrist flexors', 'grip'] },
  { id: 'quads',        name: 'Quads',        aliases: ['quadriceps', 'thighs', 'quad'] },
  { id: 'hamstrings',   name: 'Hamstrings',   aliases: ['hammies', 'hams', 'hamstring'] },
  { id: 'glutes',       name: 'Glutes',       aliases: ['butt', 'gluteus', 'glute'] },
  { id: 'calves',       name: 'Calves',       aliases: ['calf', 'gastrocnemius', 'soleus'] },
  { id: 'core',         name: 'Core',         aliases: ['abs', 'abdominals', 'midsection'] },
  { id: 'traps',        name: 'Traps',        aliases: ['trapezius', 'trap'] },
  { id: 'lats',         name: 'Lats',         aliases: ['latissimus dorsi', 'lat', 'wings'] },

  // --- Sub-Groups ---
  { id: 'upper-chest',  name: 'Upper Chest',  aliases: ['upper pec', 'clavicular head'], parentId: 'chest' },
  { id: 'lower-chest',  name: 'Lower Chest',  aliases: ['lower pec', 'sternal head'], parentId: 'chest' },
  { id: 'inner-chest',  name: 'Inner Chest',  aliases: ['mid chest'], parentId: 'chest' },

  { id: 'front-delts',  name: 'Front Delts',  aliases: ['anterior deltoid', 'front shoulder'], parentId: 'shoulders' },
  { id: 'side-delts',   name: 'Side Delts',   aliases: ['lateral deltoid', 'medial delt', 'side shoulder'], parentId: 'shoulders' },
  { id: 'rear-delts',   name: 'Rear Delts',   aliases: ['posterior deltoid', 'rear shoulder'], parentId: 'shoulders' },

  { id: 'upper-back',   name: 'Upper Back',   aliases: ['rhomboids', 'mid back'], parentId: 'back' },
  { id: 'lower-back',   name: 'Lower Back',   aliases: ['erectors', 'spinal erectors', 'lumbar'], parentId: 'back' },

  { id: 'inner-thighs', name: 'Inner Thighs', aliases: ['adductors', 'adductor'], parentId: 'quads' },
  { id: 'outer-thighs', name: 'Outer Thighs', aliases: ['abductors', 'hip abductors', 'abductor'], parentId: 'glutes' },

  { id: 'obliques',     name: 'Obliques',     aliases: ['side abs', 'love handles'], parentId: 'core' },
  { id: 'lower-abs',    name: 'Lower Abs',    aliases: ['lower abdominals'], parentId: 'core' },
  { id: 'upper-abs',    name: 'Upper Abs',    aliases: ['upper abdominals'], parentId: 'core' },
  { id: 'hip-flexors',  name: 'Hip Flexors',  aliases: ['hip flexor', 'psoas', 'iliopsoas'], parentId: 'core' },
];

// ----- EQUIPMENT TYPES -----

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'resistance band'
  | 'kettlebell'
  | 'ez-bar'
  | 'smith machine'
  | 'trap bar'
  | 'suspension trainer'
  | 'medicine ball'
  | 'foam roller'
  | 'bench'
  | 'pull-up bar';

// ----- EXERCISE DATABASE -----

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];   // muscle group ids
  secondaryMuscles: string[]; // muscle group ids
  equipment: Equipment[];
  category: string;           // maps to the existing category system
  aliases: string[];          // alternate names for search
}

export const EXERCISES: Exercise[] = [
  // ================================================================
  // CHEST (28 exercises)
  // ================================================================
  { id: 'flat-barbell-bench-press', name: 'Flat Barbell Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['barbell', 'bench'], category: 'chest', aliases: ['bench press', 'flat bench', 'bb bench'] },
  { id: 'incline-barbell-bench-press', name: 'Incline Barbell Bench Press', primaryMuscles: ['upper-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['barbell', 'bench'], category: 'chest', aliases: ['incline bench', 'incline press'] },
  { id: 'decline-barbell-bench-press', name: 'Decline Barbell Bench Press', primaryMuscles: ['lower-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['barbell', 'bench'], category: 'chest', aliases: ['decline bench', 'decline press'] },
  { id: 'flat-dumbbell-bench-press', name: 'Flat Dumbbell Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['dumbbell', 'bench'], category: 'chest', aliases: ['db bench press', 'dumbbell bench'] },
  { id: 'incline-dumbbell-bench-press', name: 'Incline Dumbbell Bench Press', primaryMuscles: ['upper-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['dumbbell', 'bench'], category: 'chest', aliases: ['incline db press', 'incline dumbbell press'] },
  { id: 'decline-dumbbell-bench-press', name: 'Decline Dumbbell Bench Press', primaryMuscles: ['lower-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['dumbbell', 'bench'], category: 'chest', aliases: ['decline db press'] },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', primaryMuscles: ['chest', 'inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['dumbbell', 'bench'], category: 'chest', aliases: ['db fly', 'chest fly', 'flat fly'] },
  { id: 'incline-dumbbell-fly', name: 'Incline Dumbbell Fly', primaryMuscles: ['upper-chest', 'inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['dumbbell', 'bench'], category: 'chest', aliases: ['incline fly'] },
  { id: 'cable-crossover', name: 'Cable Crossover', primaryMuscles: ['chest', 'inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['cable'], category: 'chest', aliases: ['cable fly', 'cable chest fly'] },
  { id: 'low-cable-crossover', name: 'Low Cable Crossover', primaryMuscles: ['upper-chest', 'inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['cable'], category: 'chest', aliases: ['low to high cable fly'] },
  { id: 'high-cable-crossover', name: 'High Cable Crossover', primaryMuscles: ['lower-chest', 'inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['cable'], category: 'chest', aliases: ['high to low cable fly'] },
  { id: 'machine-chest-press', name: 'Machine Chest Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['machine'], category: 'chest', aliases: ['chest press machine', 'seated chest press'] },
  { id: 'pec-deck', name: 'Pec Deck', primaryMuscles: ['chest', 'inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['machine'], category: 'chest', aliases: ['pec fly machine', 'pec deck fly', 'butterfly'] },
  { id: 'push-up', name: 'Push-Up', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front-delts', 'core'], equipment: ['bodyweight'], category: 'chest', aliases: ['pushup', 'press up'] },
  { id: 'incline-push-up', name: 'Incline Push-Up', primaryMuscles: ['lower-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['bodyweight'], category: 'chest', aliases: ['elevated push-up'] },
  { id: 'decline-push-up', name: 'Decline Push-Up', primaryMuscles: ['upper-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['bodyweight'], category: 'chest', aliases: ['feet elevated push-up'] },
  { id: 'dip-chest', name: 'Chest Dip', primaryMuscles: ['lower-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['bodyweight'], category: 'chest', aliases: ['dips chest focus', 'wide dip'] },
  { id: 'smith-machine-bench-press', name: 'Smith Machine Bench Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['smith machine'], category: 'chest', aliases: ['smith bench'] },
  { id: 'landmine-press', name: 'Landmine Press', primaryMuscles: ['upper-chest'], secondaryMuscles: ['front-delts', 'triceps'], equipment: ['barbell'], category: 'chest', aliases: ['angled press'] },
  { id: 'resistance-band-chest-press', name: 'Resistance Band Chest Press', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['resistance band'], category: 'chest', aliases: ['band chest press'] },
  { id: 'dumbbell-pullover', name: 'Dumbbell Pullover', primaryMuscles: ['chest', 'lats'], secondaryMuscles: ['triceps'], equipment: ['dumbbell', 'bench'], category: 'chest', aliases: ['db pullover', 'chest pullover'] },
  { id: 'svend-press', name: 'Svend Press', primaryMuscles: ['inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['dumbbell'], category: 'chest', aliases: ['plate squeeze press'] },
  { id: 'close-grip-bench-press', name: 'Close-Grip Bench Press', primaryMuscles: ['triceps', 'inner-chest'], secondaryMuscles: ['front-delts'], equipment: ['barbell', 'bench'], category: 'chest', aliases: ['close grip bench', 'cgbp'] },
  { id: 'floor-press', name: 'Floor Press', primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front-delts'], equipment: ['barbell'], category: 'chest', aliases: ['barbell floor press'] },
  { id: 'dumbbell-floor-press', name: 'Dumbbell Floor Press', primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front-delts'], equipment: ['dumbbell'], category: 'chest', aliases: ['db floor press'] },
  { id: 'machine-incline-press', name: 'Machine Incline Press', primaryMuscles: ['upper-chest'], secondaryMuscles: ['triceps', 'front-delts'], equipment: ['machine'], category: 'chest', aliases: ['incline press machine'] },
  { id: 'hex-press', name: 'Hex Press', primaryMuscles: ['inner-chest'], secondaryMuscles: ['triceps'], equipment: ['dumbbell', 'bench'], category: 'chest', aliases: ['squeeze press', 'crush press'] },
  { id: 'single-arm-cable-fly', name: 'Single Arm Cable Fly', primaryMuscles: ['chest'], secondaryMuscles: ['front-delts'], equipment: ['cable'], category: 'chest', aliases: ['one arm cable fly'] },

  // ================================================================
  // BACK (27 exercises)
  // ================================================================
  { id: 'barbell-row', name: 'Barbell Row', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['biceps', 'rear-delts', 'traps'], equipment: ['barbell'], category: 'back', aliases: ['bent over row', 'bb row', 'barbell bent-over row'] },
  { id: 'dumbbell-row', name: 'Dumbbell Row', primaryMuscles: ['lats', 'upper-back'], secondaryMuscles: ['biceps', 'rear-delts'], equipment: ['dumbbell', 'bench'], category: 'back', aliases: ['single arm row', 'db row', 'one arm row'] },
  { id: 'pull-up', name: 'Pull-Up', primaryMuscles: ['lats', 'back'], secondaryMuscles: ['biceps', 'forearms'], equipment: ['bodyweight', 'pull-up bar'], category: 'back', aliases: ['pullup', 'chin-up overhand'] },
  { id: 'chin-up', name: 'Chin-Up', primaryMuscles: ['lats', 'biceps'], secondaryMuscles: ['back', 'forearms'], equipment: ['bodyweight', 'pull-up bar'], category: 'back', aliases: ['chinup', 'underhand pull-up'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'upper-back'], equipment: ['cable', 'machine'], category: 'back', aliases: ['pulldown', 'cable pulldown', 'wide grip pulldown'] },
  { id: 'close-grip-lat-pulldown', name: 'Close Grip Lat Pulldown', primaryMuscles: ['lats', 'lower-back'], secondaryMuscles: ['biceps'], equipment: ['cable', 'machine'], category: 'back', aliases: ['v-bar pulldown', 'narrow grip pulldown'] },
  { id: 'seated-cable-row', name: 'Seated Cable Row', primaryMuscles: ['upper-back', 'lats'], secondaryMuscles: ['biceps', 'rear-delts'], equipment: ['cable', 'machine'], category: 'back', aliases: ['cable row', 'seated row', 'low row'] },
  { id: 't-bar-row', name: 'T-Bar Row', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['biceps', 'rear-delts', 'traps'], equipment: ['barbell', 'machine'], category: 'back', aliases: ['t bar row', 'landmine row'] },
  { id: 'deadlift', name: 'Deadlift', primaryMuscles: ['back', 'lower-back', 'hamstrings', 'glutes'], secondaryMuscles: ['quads', 'traps', 'forearms'], equipment: ['barbell'], category: 'back', aliases: ['conventional deadlift', 'dl'] },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', primaryMuscles: ['glutes', 'quads', 'back'], secondaryMuscles: ['hamstrings', 'inner-thighs', 'lower-back'], equipment: ['barbell'], category: 'back', aliases: ['wide stance deadlift'] },
  { id: 'rack-pull', name: 'Rack Pull', primaryMuscles: ['back', 'lower-back', 'traps'], secondaryMuscles: ['glutes', 'hamstrings', 'forearms'], equipment: ['barbell'], category: 'back', aliases: ['partial deadlift'] },
  { id: 'pendlay-row', name: 'Pendlay Row', primaryMuscles: ['upper-back', 'lats'], secondaryMuscles: ['biceps', 'lower-back'], equipment: ['barbell'], category: 'back', aliases: ['strict barbell row'] },
  { id: 'face-pull', name: 'Face Pull', primaryMuscles: ['rear-delts', 'upper-back'], secondaryMuscles: ['traps'], equipment: ['cable'], category: 'back', aliases: ['rope face pull', 'cable face pull'] },
  { id: 'straight-arm-pulldown', name: 'Straight Arm Pulldown', primaryMuscles: ['lats'], secondaryMuscles: ['triceps', 'rear-delts'], equipment: ['cable'], category: 'back', aliases: ['straight arm pushdown', 'lat pushdown'] },
  { id: 'machine-row', name: 'Machine Row', primaryMuscles: ['upper-back', 'lats'], secondaryMuscles: ['biceps'], equipment: ['machine'], category: 'back', aliases: ['chest supported machine row', 'iso-lateral row'] },
  { id: 'inverted-row', name: 'Inverted Row', primaryMuscles: ['upper-back', 'lats'], secondaryMuscles: ['biceps', 'rear-delts'], equipment: ['bodyweight'], category: 'back', aliases: ['body row', 'australian pull-up'] },
  { id: 'single-arm-cable-row', name: 'Single Arm Cable Row', primaryMuscles: ['lats', 'upper-back'], secondaryMuscles: ['biceps', 'rear-delts'], equipment: ['cable'], category: 'back', aliases: ['one arm cable row'] },
  { id: 'meadows-row', name: 'Meadows Row', primaryMuscles: ['lats', 'upper-back'], secondaryMuscles: ['biceps', 'rear-delts'], equipment: ['barbell'], category: 'back', aliases: ['landmine meadows row'] },
  { id: 'seal-row', name: 'Seal Row', primaryMuscles: ['upper-back', 'lats'], secondaryMuscles: ['biceps', 'rear-delts'], equipment: ['dumbbell', 'bench'], category: 'back', aliases: ['chest supported dumbbell row', 'prone row'] },
  { id: 'kroc-row', name: 'Kroc Row', primaryMuscles: ['lats', 'upper-back'], secondaryMuscles: ['biceps', 'forearms', 'traps'], equipment: ['dumbbell'], category: 'back', aliases: ['heavy dumbbell row'] },
  { id: 'back-extension', name: 'Back Extension', primaryMuscles: ['lower-back'], secondaryMuscles: ['glutes', 'hamstrings'], equipment: ['bodyweight', 'machine'], category: 'back', aliases: ['hyperextension', 'roman chair extension'] },
  { id: 'good-morning', name: 'Good Morning', primaryMuscles: ['lower-back', 'hamstrings'], secondaryMuscles: ['glutes'], equipment: ['barbell'], category: 'back', aliases: ['barbell good morning'] },
  { id: 'wide-grip-pull-up', name: 'Wide Grip Pull-Up', primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'upper-back'], equipment: ['bodyweight', 'pull-up bar'], category: 'back', aliases: ['wide pull-up'] },
  { id: 'neutral-grip-pull-up', name: 'Neutral Grip Pull-Up', primaryMuscles: ['lats', 'biceps'], secondaryMuscles: ['upper-back'], equipment: ['bodyweight', 'pull-up bar'], category: 'back', aliases: ['hammer grip pull-up', 'parallel grip pull-up'] },
  { id: 'resistance-band-row', name: 'Resistance Band Row', primaryMuscles: ['upper-back', 'lats'], secondaryMuscles: ['biceps'], equipment: ['resistance band'], category: 'back', aliases: ['band row'] },
  { id: 'smith-machine-row', name: 'Smith Machine Row', primaryMuscles: ['upper-back', 'lats'], secondaryMuscles: ['biceps', 'rear-delts'], equipment: ['smith machine'], category: 'back', aliases: ['smith row'] },
  { id: 'cable-pullover', name: 'Cable Pullover', primaryMuscles: ['lats'], secondaryMuscles: ['chest', 'triceps'], equipment: ['cable'], category: 'back', aliases: ['cable lat pullover'] },

  // ================================================================
  // SHOULDERS (24 exercises)
  // ================================================================
  { id: 'overhead-press', name: 'Overhead Press', primaryMuscles: ['shoulders', 'front-delts'], secondaryMuscles: ['triceps', 'traps'], equipment: ['barbell'], category: 'shoulders', aliases: ['ohp', 'military press', 'strict press', 'barbell shoulder press'] },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', primaryMuscles: ['shoulders', 'front-delts'], secondaryMuscles: ['triceps', 'traps'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['db shoulder press', 'seated dumbbell press'] },
  { id: 'arnold-press', name: 'Arnold Press', primaryMuscles: ['shoulders', 'front-delts', 'side-delts'], secondaryMuscles: ['triceps'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['arnold dumbbell press'] },
  { id: 'lateral-raise', name: 'Lateral Raise', primaryMuscles: ['side-delts'], secondaryMuscles: ['traps'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['side raise', 'side lateral raise', 'db lateral raise'] },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', primaryMuscles: ['side-delts'], secondaryMuscles: ['traps'], equipment: ['cable'], category: 'shoulders', aliases: ['cable side raise'] },
  { id: 'front-raise', name: 'Front Raise', primaryMuscles: ['front-delts'], secondaryMuscles: ['side-delts'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['dumbbell front raise', 'anterior raise'] },
  { id: 'cable-front-raise', name: 'Cable Front Raise', primaryMuscles: ['front-delts'], secondaryMuscles: ['side-delts'], equipment: ['cable'], category: 'shoulders', aliases: [] },
  { id: 'reverse-fly', name: 'Reverse Fly', primaryMuscles: ['rear-delts'], secondaryMuscles: ['upper-back', 'traps'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['reverse pec deck', 'rear delt fly', 'bent over fly'] },
  { id: 'cable-reverse-fly', name: 'Cable Reverse Fly', primaryMuscles: ['rear-delts'], secondaryMuscles: ['upper-back'], equipment: ['cable'], category: 'shoulders', aliases: ['cable rear delt fly'] },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', primaryMuscles: ['shoulders', 'front-delts'], secondaryMuscles: ['triceps'], equipment: ['machine'], category: 'shoulders', aliases: ['shoulder press machine'] },
  { id: 'machine-lateral-raise', name: 'Machine Lateral Raise', primaryMuscles: ['side-delts'], secondaryMuscles: ['traps'], equipment: ['machine'], category: 'shoulders', aliases: ['lateral raise machine'] },
  { id: 'machine-reverse-fly', name: 'Machine Reverse Fly', primaryMuscles: ['rear-delts'], secondaryMuscles: ['upper-back'], equipment: ['machine'], category: 'shoulders', aliases: ['reverse pec deck machine'] },
  { id: 'upright-row', name: 'Upright Row', primaryMuscles: ['side-delts', 'traps'], secondaryMuscles: ['front-delts', 'biceps'], equipment: ['barbell'], category: 'shoulders', aliases: ['barbell upright row'] },
  { id: 'dumbbell-upright-row', name: 'Dumbbell Upright Row', primaryMuscles: ['side-delts', 'traps'], secondaryMuscles: ['front-delts', 'biceps'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['db upright row'] },
  { id: 'barbell-shrug', name: 'Barbell Shrug', primaryMuscles: ['traps'], secondaryMuscles: ['shoulders'], equipment: ['barbell'], category: 'shoulders', aliases: ['shrugs', 'bb shrug'] },
  { id: 'dumbbell-shrug', name: 'Dumbbell Shrug', primaryMuscles: ['traps'], secondaryMuscles: ['shoulders'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['db shrug'] },
  { id: 'behind-the-neck-press', name: 'Behind the Neck Press', primaryMuscles: ['shoulders', 'side-delts'], secondaryMuscles: ['triceps', 'traps'], equipment: ['barbell'], category: 'shoulders', aliases: ['btn press'] },
  { id: 'push-press', name: 'Push Press', primaryMuscles: ['shoulders', 'front-delts'], secondaryMuscles: ['triceps', 'quads'], equipment: ['barbell'], category: 'shoulders', aliases: ['barbell push press'] },
  { id: 'pike-push-up', name: 'Pike Push-Up', primaryMuscles: ['shoulders', 'front-delts'], secondaryMuscles: ['triceps'], equipment: ['bodyweight'], category: 'shoulders', aliases: ['pike press'] },
  { id: 'handstand-push-up', name: 'Handstand Push-Up', primaryMuscles: ['shoulders'], secondaryMuscles: ['triceps', 'traps'], equipment: ['bodyweight'], category: 'shoulders', aliases: ['hspu'] },
  { id: 'resistance-band-lateral-raise', name: 'Resistance Band Lateral Raise', primaryMuscles: ['side-delts'], secondaryMuscles: ['traps'], equipment: ['resistance band'], category: 'shoulders', aliases: ['band lateral raise'] },
  { id: 'smith-machine-shoulder-press', name: 'Smith Machine Shoulder Press', primaryMuscles: ['shoulders', 'front-delts'], secondaryMuscles: ['triceps'], equipment: ['smith machine'], category: 'shoulders', aliases: ['smith shoulder press'] },
  { id: 'lu-raise', name: 'Lu Raise', primaryMuscles: ['side-delts', 'front-delts'], secondaryMuscles: ['traps'], equipment: ['dumbbell'], category: 'shoulders', aliases: ['l-raise', 'lateral to front raise combo'] },
  { id: 'face-pull-shoulders', name: 'Face Pull (Shoulder Focus)', primaryMuscles: ['rear-delts', 'side-delts'], secondaryMuscles: ['upper-back', 'traps'], equipment: ['cable'], category: 'shoulders', aliases: ['external rotation face pull'] },

  // ================================================================
  // BICEPS (16 exercises)
  // ================================================================
  { id: 'barbell-curl', name: 'Barbell Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['barbell'], category: 'arms', aliases: ['bb curl', 'standing barbell curl'] },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['dumbbell'], category: 'arms', aliases: ['db curl', 'standing dumbbell curl', 'bicep curl'] },
  { id: 'hammer-curl', name: 'Hammer Curl', primaryMuscles: ['biceps', 'forearms'], secondaryMuscles: [], equipment: ['dumbbell'], category: 'arms', aliases: ['neutral grip curl'] },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['dumbbell', 'bench'], category: 'arms', aliases: ['incline curl'] },
  { id: 'preacher-curl', name: 'Preacher Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['barbell', 'machine'], category: 'arms', aliases: ['scott curl'] },
  { id: 'ez-bar-curl', name: 'EZ Bar Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['ez-bar'], category: 'arms', aliases: ['ez curl', 'easy bar curl'] },
  { id: 'concentration-curl', name: 'Concentration Curl', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: ['dumbbell'], category: 'arms', aliases: ['seated concentration curl'] },
  { id: 'cable-curl', name: 'Cable Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['cable'], category: 'arms', aliases: ['cable bicep curl'] },
  { id: 'cable-hammer-curl', name: 'Cable Hammer Curl', primaryMuscles: ['biceps', 'forearms'], secondaryMuscles: [], equipment: ['cable'], category: 'arms', aliases: ['rope hammer curl'] },
  { id: 'spider-curl', name: 'Spider Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['dumbbell', 'bench'], category: 'arms', aliases: ['prone incline curl'] },
  { id: 'machine-bicep-curl', name: 'Machine Bicep Curl', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: ['machine'], category: 'arms', aliases: ['bicep curl machine'] },
  { id: 'cross-body-hammer-curl', name: 'Cross Body Hammer Curl', primaryMuscles: ['biceps', 'forearms'], secondaryMuscles: [], equipment: ['dumbbell'], category: 'arms', aliases: ['cross body curl', 'pinwheel curl'] },
  { id: 'reverse-curl', name: 'Reverse Curl', primaryMuscles: ['forearms', 'biceps'], secondaryMuscles: [], equipment: ['barbell'], category: 'arms', aliases: ['overhand curl', 'reverse grip curl'] },
  { id: 'zottman-curl', name: 'Zottman Curl', primaryMuscles: ['biceps', 'forearms'], secondaryMuscles: [], equipment: ['dumbbell'], category: 'arms', aliases: [] },
  { id: 'resistance-band-curl', name: 'Resistance Band Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['resistance band'], category: 'arms', aliases: ['band curl'] },
  { id: '21s-curl', name: '21s Curl', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], equipment: ['barbell', 'ez-bar'], category: 'arms', aliases: ['21 curl', 'twenty ones'] },

  // ================================================================
  // TRICEPS (16 exercises)
  // ================================================================
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['cable'], category: 'arms', aliases: ['cable pushdown', 'tricep pressdown', 'rope pushdown'] },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['dumbbell'], category: 'arms', aliases: ['french press', 'overhead extension', 'db overhead tricep'] },
  { id: 'cable-overhead-extension', name: 'Cable Overhead Extension', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['cable'], category: 'arms', aliases: ['overhead cable tricep'] },
  { id: 'skull-crusher', name: 'Skull Crusher', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['barbell', 'ez-bar', 'bench'], category: 'arms', aliases: ['lying tricep extension', 'nose breaker'] },
  { id: 'dip-tricep', name: 'Tricep Dip', primaryMuscles: ['triceps'], secondaryMuscles: ['chest', 'front-delts'], equipment: ['bodyweight'], category: 'arms', aliases: ['dips', 'parallel bar dip'] },
  { id: 'bench-dip', name: 'Bench Dip', primaryMuscles: ['triceps'], secondaryMuscles: ['chest', 'front-delts'], equipment: ['bodyweight', 'bench'], category: 'arms', aliases: ['chair dip'] },
  { id: 'kickback', name: 'Tricep Kickback', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['dumbbell'], category: 'arms', aliases: ['dumbbell kickback', 'db kickback'] },
  { id: 'cable-kickback', name: 'Cable Kickback', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['cable'], category: 'arms', aliases: [] },
  { id: 'diamond-push-up', name: 'Diamond Push-Up', primaryMuscles: ['triceps'], secondaryMuscles: ['chest', 'front-delts'], equipment: ['bodyweight'], category: 'arms', aliases: ['close grip push-up', 'triangle push-up'] },
  { id: 'single-arm-pushdown', name: 'Single Arm Pushdown', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['cable'], category: 'arms', aliases: ['one arm pushdown'] },
  { id: 'machine-tricep-extension', name: 'Machine Tricep Extension', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['machine'], category: 'arms', aliases: ['tricep extension machine'] },
  { id: 'ez-bar-skull-crusher', name: 'EZ Bar Skull Crusher', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['ez-bar', 'bench'], category: 'arms', aliases: ['ez bar lying extension'] },
  { id: 'jm-press', name: 'JM Press', primaryMuscles: ['triceps'], secondaryMuscles: ['chest'], equipment: ['barbell', 'bench'], category: 'arms', aliases: [] },
  { id: 'tate-press', name: 'Tate Press', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['dumbbell', 'bench'], category: 'arms', aliases: ['elbows out extension'] },
  { id: 'resistance-band-pushdown', name: 'Resistance Band Pushdown', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['resistance band'], category: 'arms', aliases: ['band pushdown'] },
  { id: 'bodyweight-tricep-extension', name: 'Bodyweight Tricep Extension', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'arms', aliases: ['bodyweight skull crusher'] },

  // ================================================================
  // FOREARMS (6 exercises)
  // ================================================================
  { id: 'wrist-curl', name: 'Wrist Curl', primaryMuscles: ['forearms'], secondaryMuscles: [], equipment: ['barbell', 'dumbbell'], category: 'arms', aliases: ['barbell wrist curl', 'forearm curl'] },
  { id: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', primaryMuscles: ['forearms'], secondaryMuscles: [], equipment: ['barbell', 'dumbbell'], category: 'arms', aliases: ['wrist extension'] },
  { id: 'farmers-walk', name: "Farmer's Walk", primaryMuscles: ['forearms', 'traps'], secondaryMuscles: ['core'], equipment: ['dumbbell', 'kettlebell'], category: 'arms', aliases: ['farmers carry', 'loaded carry'] },
  { id: 'dead-hang', name: 'Dead Hang', primaryMuscles: ['forearms'], secondaryMuscles: ['lats', 'shoulders'], equipment: ['bodyweight', 'pull-up bar'], category: 'arms', aliases: ['bar hang', 'passive hang'] },
  { id: 'plate-pinch', name: 'Plate Pinch', primaryMuscles: ['forearms'], secondaryMuscles: [], equipment: ['barbell'], category: 'arms', aliases: ['plate pinch hold'] },
  { id: 'behind-the-back-wrist-curl', name: 'Behind the Back Wrist Curl', primaryMuscles: ['forearms'], secondaryMuscles: [], equipment: ['barbell'], category: 'arms', aliases: ['btb wrist curl'] },

  // ================================================================
  // QUADS (18 exercises)
  // ================================================================
  { id: 'barbell-squat', name: 'Barbell Back Squat', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'core', 'lower-back'], equipment: ['barbell'], category: 'legs', aliases: ['squat', 'back squat', 'bb squat'] },
  { id: 'front-squat', name: 'Front Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'core'], equipment: ['barbell'], category: 'legs', aliases: ['barbell front squat'] },
  { id: 'goblet-squat', name: 'Goblet Squat', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['core'], equipment: ['dumbbell', 'kettlebell'], category: 'legs', aliases: ['db goblet squat'] },
  { id: 'leg-press', name: 'Leg Press', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: ['machine'], category: 'legs', aliases: ['45 degree leg press', 'machine leg press'] },
  { id: 'hack-squat', name: 'Hack Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], equipment: ['machine'], category: 'legs', aliases: ['hack squat machine'] },
  { id: 'leg-extension', name: 'Leg Extension', primaryMuscles: ['quads'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: ['quad extension', 'machine leg extension'] },
  { id: 'lunge', name: 'Lunge', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['bodyweight'], category: 'legs', aliases: ['forward lunge', 'walking lunge'] },
  { id: 'dumbbell-lunge', name: 'Dumbbell Lunge', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: ['dumbbell'], category: 'legs', aliases: ['db lunge', 'weighted lunge'] },
  { id: 'barbell-lunge', name: 'Barbell Lunge', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: ['barbell'], category: 'legs', aliases: ['bb lunge'] },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['dumbbell', 'bodyweight'], category: 'legs', aliases: ['rear foot elevated split squat', 'bss'] },
  { id: 'step-up', name: 'Step-Up', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: ['dumbbell', 'bodyweight', 'bench'], category: 'legs', aliases: ['box step up', 'weighted step up'] },
  { id: 'smith-machine-squat', name: 'Smith Machine Squat', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: ['smith machine'], category: 'legs', aliases: ['smith squat'] },
  { id: 'sissy-squat', name: 'Sissy Squat', primaryMuscles: ['quads'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'legs', aliases: [] },
  { id: 'wall-sit', name: 'Wall Sit', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], equipment: ['bodyweight'], category: 'legs', aliases: ['wall squat'] },
  { id: 'pistol-squat', name: 'Pistol Squat', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['core', 'hamstrings'], equipment: ['bodyweight'], category: 'legs', aliases: ['single leg squat'] },
  { id: 'pendulum-squat', name: 'Pendulum Squat', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], equipment: ['machine'], category: 'legs', aliases: [] },
  { id: 'belt-squat', name: 'Belt Squat', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: [] },
  { id: 'v-squat', name: 'V Squat', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: ['machine'], category: 'legs', aliases: ['v-squat machine'] },

  // ================================================================
  // HAMSTRINGS (12 exercises)
  // ================================================================
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['lower-back'], equipment: ['barbell'], category: 'legs', aliases: ['rdl', 'stiff leg deadlift'] },
  { id: 'dumbbell-rdl', name: 'Dumbbell Romanian Deadlift', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['lower-back'], equipment: ['dumbbell'], category: 'legs', aliases: ['db rdl'] },
  { id: 'single-leg-rdl', name: 'Single Leg Romanian Deadlift', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['core', 'lower-back'], equipment: ['dumbbell'], category: 'legs', aliases: ['single leg rdl', 'one leg rdl'] },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: ['calves'], equipment: ['machine'], category: 'legs', aliases: ['prone leg curl', 'hamstring curl'] },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: ['seated hamstring curl'] },
  { id: 'nordic-curl', name: 'Nordic Curl', primaryMuscles: ['hamstrings'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'legs', aliases: ['nordic hamstring curl', 'nordic ham curl'] },
  { id: 'glute-ham-raise', name: 'Glute Ham Raise', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['lower-back'], equipment: ['machine', 'bodyweight'], category: 'legs', aliases: ['ghr'] },
  { id: 'cable-pull-through', name: 'Cable Pull Through', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['lower-back'], equipment: ['cable'], category: 'legs', aliases: ['pull through'] },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['core', 'shoulders'], equipment: ['kettlebell'], category: 'legs', aliases: ['kb swing', 'russian swing'] },
  { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', primaryMuscles: ['hamstrings'], secondaryMuscles: ['lower-back', 'glutes'], equipment: ['barbell'], category: 'legs', aliases: ['sldl', 'straight leg deadlift'] },
  { id: 'deficit-deadlift', name: 'Deficit Deadlift', primaryMuscles: ['hamstrings', 'back'], secondaryMuscles: ['quads', 'glutes', 'lower-back'], equipment: ['barbell'], category: 'legs', aliases: [] },
  { id: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', primaryMuscles: ['quads', 'hamstrings', 'glutes'], secondaryMuscles: ['back', 'traps'], equipment: ['trap bar'], category: 'legs', aliases: ['hex bar deadlift'] },

  // ================================================================
  // GLUTES (10 exercises)
  // ================================================================
  { id: 'hip-thrust', name: 'Hip Thrust', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['barbell', 'bench'], category: 'legs', aliases: ['barbell hip thrust', 'glute bridge barbell'] },
  { id: 'glute-bridge', name: 'Glute Bridge', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], equipment: ['bodyweight'], category: 'legs', aliases: ['bridge'] },
  { id: 'single-leg-hip-thrust', name: 'Single Leg Hip Thrust', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['bodyweight', 'bench'], category: 'legs', aliases: ['one leg hip thrust'] },
  { id: 'cable-glute-kickback', name: 'Cable Glute Kickback', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], equipment: ['cable'], category: 'legs', aliases: ['cable kickback', 'glute kickback'] },
  { id: 'machine-glute-kickback', name: 'Machine Glute Kickback', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], equipment: ['machine'], category: 'legs', aliases: ['glute machine'] },
  { id: 'hip-abduction', name: 'Hip Abduction', primaryMuscles: ['outer-thighs', 'glutes'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: ['abduction machine', 'outer thigh machine'] },
  { id: 'hip-adduction', name: 'Hip Adduction', primaryMuscles: ['inner-thighs'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: ['adduction machine', 'inner thigh machine'] },
  { id: 'sumo-squat', name: 'Sumo Squat', primaryMuscles: ['glutes', 'inner-thighs', 'quads'], secondaryMuscles: [], equipment: ['dumbbell', 'kettlebell'], category: 'legs', aliases: ['wide stance squat', 'plie squat'] },
  { id: 'fire-hydrant', name: 'Fire Hydrant', primaryMuscles: ['glutes', 'outer-thighs'], secondaryMuscles: ['core'], equipment: ['bodyweight', 'resistance band'], category: 'legs', aliases: [] },
  { id: 'donkey-kick', name: 'Donkey Kick', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['bodyweight', 'resistance band'], category: 'legs', aliases: ['glute kickback bodyweight'] },

  // ================================================================
  // CALVES (6 exercises)
  // ================================================================
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: ['calf raise', 'machine calf raise'] },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: ['seated calf machine'] },
  { id: 'donkey-calf-raise', name: 'Donkey Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: ['machine', 'bodyweight'], category: 'legs', aliases: [] },
  { id: 'smith-machine-calf-raise', name: 'Smith Machine Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: ['smith machine'], category: 'legs', aliases: ['smith calf raise'] },
  { id: 'single-leg-calf-raise', name: 'Single Leg Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: ['bodyweight', 'dumbbell'], category: 'legs', aliases: ['one leg calf raise'] },
  { id: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: ['machine'], category: 'legs', aliases: ['calf press'] },

  // ================================================================
  // CORE / ABS (20 exercises)
  // ================================================================
  { id: 'crunch', name: 'Crunch', primaryMuscles: ['core', 'upper-abs'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'core', aliases: ['basic crunch', 'ab crunch'] },
  { id: 'cable-crunch', name: 'Cable Crunch', primaryMuscles: ['core', 'upper-abs'], secondaryMuscles: [], equipment: ['cable'], category: 'core', aliases: ['kneeling cable crunch'] },
  { id: 'reverse-crunch', name: 'Reverse Crunch', primaryMuscles: ['core', 'lower-abs'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'core', aliases: [] },
  { id: 'leg-raise', name: 'Leg Raise', primaryMuscles: ['core', 'lower-abs', 'hip-flexors'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'core', aliases: ['lying leg raise'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', primaryMuscles: ['core', 'lower-abs', 'hip-flexors'], secondaryMuscles: ['forearms'], equipment: ['bodyweight', 'pull-up bar'], category: 'core', aliases: ['hanging knee raise'] },
  { id: 'plank', name: 'Plank', primaryMuscles: ['core'], secondaryMuscles: ['shoulders'], equipment: ['bodyweight'], category: 'core', aliases: ['front plank', 'forearm plank'] },
  { id: 'side-plank', name: 'Side Plank', primaryMuscles: ['obliques', 'core'], secondaryMuscles: ['shoulders'], equipment: ['bodyweight'], category: 'core', aliases: [] },
  { id: 'russian-twist', name: 'Russian Twist', primaryMuscles: ['obliques', 'core'], secondaryMuscles: [], equipment: ['bodyweight', 'medicine ball'], category: 'core', aliases: [] },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', primaryMuscles: ['core', 'obliques'], secondaryMuscles: ['hip-flexors'], equipment: ['bodyweight'], category: 'core', aliases: ['bicycle'] },
  { id: 'mountain-climber', name: 'Mountain Climber', primaryMuscles: ['core', 'hip-flexors'], secondaryMuscles: ['shoulders', 'quads'], equipment: ['bodyweight'], category: 'core', aliases: ['mountain climbers'] },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', primaryMuscles: ['core'], secondaryMuscles: ['shoulders', 'lats'], equipment: ['bodyweight'], category: 'core', aliases: ['ab roller', 'rollout'] },
  { id: 'woodchopper', name: 'Woodchopper', primaryMuscles: ['obliques', 'core'], secondaryMuscles: ['shoulders'], equipment: ['cable', 'medicine ball'], category: 'core', aliases: ['cable woodchop', 'wood chop'] },
  { id: 'dead-bug', name: 'Dead Bug', primaryMuscles: ['core'], secondaryMuscles: ['hip-flexors'], equipment: ['bodyweight'], category: 'core', aliases: [] },
  { id: 'v-up', name: 'V-Up', primaryMuscles: ['core', 'upper-abs', 'lower-abs'], secondaryMuscles: ['hip-flexors'], equipment: ['bodyweight'], category: 'core', aliases: ['v-sit', 'jackknife'] },
  { id: 'pallof-press', name: 'Pallof Press', primaryMuscles: ['core', 'obliques'], secondaryMuscles: [], equipment: ['cable', 'resistance band'], category: 'core', aliases: ['anti-rotation press'] },
  { id: 'dragon-flag', name: 'Dragon Flag', primaryMuscles: ['core'], secondaryMuscles: ['hip-flexors'], equipment: ['bodyweight', 'bench'], category: 'core', aliases: [] },
  { id: 'toe-touch', name: 'Toe Touch', primaryMuscles: ['core', 'upper-abs'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'core', aliases: ['lying toe touch'] },
  { id: 'decline-crunch', name: 'Decline Crunch', primaryMuscles: ['core', 'upper-abs'], secondaryMuscles: [], equipment: ['bodyweight', 'bench'], category: 'core', aliases: ['decline sit-up'] },
  { id: 'flutter-kick', name: 'Flutter Kick', primaryMuscles: ['core', 'lower-abs', 'hip-flexors'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'core', aliases: ['scissor kick'] },
  { id: 'sit-up', name: 'Sit-Up', primaryMuscles: ['core', 'hip-flexors'], secondaryMuscles: [], equipment: ['bodyweight'], category: 'core', aliases: ['situp'] },

  // ================================================================
  // CARDIO / FULL BODY (12 exercises)
  // ================================================================
  { id: 'treadmill-run', name: 'Treadmill Run', primaryMuscles: ['quads', 'hamstrings', 'calves'], secondaryMuscles: ['core', 'glutes'], equipment: ['machine'], category: 'cardio', aliases: ['treadmill', 'running'] },
  { id: 'stationary-bike', name: 'Stationary Bike', primaryMuscles: ['quads', 'hamstrings'], secondaryMuscles: ['calves', 'glutes'], equipment: ['machine'], category: 'cardio', aliases: ['cycling', 'bike', 'spin bike'] },
  { id: 'rowing-machine', name: 'Rowing Machine', primaryMuscles: ['back', 'quads'], secondaryMuscles: ['biceps', 'core', 'hamstrings'], equipment: ['machine'], category: 'cardio', aliases: ['rower', 'erg', 'ergometer'] },
  { id: 'elliptical', name: 'Elliptical', primaryMuscles: ['quads', 'hamstrings'], secondaryMuscles: ['glutes', 'core'], equipment: ['machine'], category: 'cardio', aliases: ['cross trainer', 'elliptical trainer'] },
  { id: 'stairmaster', name: 'Stairmaster', primaryMuscles: ['quads', 'glutes', 'calves'], secondaryMuscles: ['hamstrings'], equipment: ['machine'], category: 'cardio', aliases: ['stair climber', 'step mill'] },
  { id: 'jump-rope', name: 'Jump Rope', primaryMuscles: ['calves'], secondaryMuscles: ['quads', 'core', 'shoulders', 'forearms'], equipment: ['bodyweight'], category: 'cardio', aliases: ['skipping rope', 'skip rope'] },
  { id: 'burpee', name: 'Burpee', primaryMuscles: ['core', 'quads', 'chest'], secondaryMuscles: ['shoulders', 'triceps', 'hamstrings'], equipment: ['bodyweight'], category: 'cardio', aliases: ['burpees'] },
  { id: 'box-jump', name: 'Box Jump', primaryMuscles: ['quads', 'glutes', 'calves'], secondaryMuscles: ['hamstrings', 'core'], equipment: ['bodyweight'], category: 'cardio', aliases: ['plyometric box jump'] },
  { id: 'battle-ropes', name: 'Battle Ropes', primaryMuscles: ['shoulders', 'core'], secondaryMuscles: ['biceps', 'forearms', 'back'], equipment: ['bodyweight'], category: 'cardio', aliases: ['battle rope', 'heavy ropes'] },
  { id: 'sled-push', name: 'Sled Push', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['calves', 'core', 'shoulders'], equipment: ['machine'], category: 'cardio', aliases: ['prowler push'] },
  { id: 'assault-bike', name: 'Assault Bike', primaryMuscles: ['quads', 'hamstrings'], secondaryMuscles: ['shoulders', 'core', 'biceps'], equipment: ['machine'], category: 'cardio', aliases: ['air bike', 'fan bike'] },
  { id: 'clean-and-press', name: 'Clean and Press', primaryMuscles: ['shoulders', 'quads', 'back'], secondaryMuscles: ['triceps', 'core', 'glutes', 'traps'], equipment: ['barbell'], category: 'cardio', aliases: ['clean & press', 'clean press'] },
];

// ============================================================
// SEARCH UTILITIES
// ============================================================

/**
 * Normalise a search term for matching:
 * lowercase, strip non-alphanumeric, collapse whitespace.
 */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Search muscles by name, alias, or parent group.
 * Returns matching MuscleGroup items sorted by relevance.
 */
export function searchMuscles(query: string): MuscleGroup[] {
  if (!query.trim()) return MUSCLE_GROUPS;

  const q = normalise(query);
  const tokens = q.split(' ');

  return MUSCLE_GROUPS
    .map((m) => {
      const nameN = normalise(m.name);
      const aliasesN = m.aliases.map(normalise);

      let score = 0;

      // Exact name match
      if (nameN === q) score += 100;
      // Name starts with query
      else if (nameN.startsWith(q)) score += 80;
      // Name contains query
      else if (nameN.includes(q)) score += 60;

      // Alias exact match
      if (aliasesN.some((a) => a === q)) score += 90;
      // Alias starts with query
      else if (aliasesN.some((a) => a.startsWith(q))) score += 70;
      // Alias contains query
      else if (aliasesN.some((a) => a.includes(q))) score += 50;

      // Token matching (for multi-word queries)
      if (score === 0) {
        const matchedTokens = tokens.filter(
          (t) => nameN.includes(t) || aliasesN.some((a) => a.includes(t))
        );
        score += matchedTokens.length * 20;
      }

      return { muscle: m, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.muscle);
}

/**
 * Search exercises by name, alias, category, muscle, or equipment.
 * Returns matching Exercise items sorted by relevance.
 */
export function searchExercises(query: string, muscleFilter?: string[]): Exercise[] {
  let pool = EXERCISES;

  // Muscle filter narrows pool first
  if (muscleFilter && muscleFilter.length > 0) {
    pool = pool.filter((ex) =>
      muscleFilter.some(
        (mId) => ex.primaryMuscles.includes(mId) || ex.secondaryMuscles.includes(mId)
      )
    );
  }

  if (!query.trim()) return pool;

  const q = normalise(query);
  const tokens = q.split(' ');

  return pool
    .map((ex) => {
      const nameN = normalise(ex.name);
      const aliasesN = ex.aliases.map(normalise);
      const catN = normalise(ex.category);
      const equipN = ex.equipment.map(normalise);

      let score = 0;

      // Name matching
      if (nameN === q) score += 100;
      else if (nameN.startsWith(q)) score += 80;
      else if (nameN.includes(q)) score += 60;

      // Alias matching
      if (aliasesN.some((a) => a === q)) score += 90;
      else if (aliasesN.some((a) => a.startsWith(q))) score += 70;
      else if (aliasesN.some((a) => a.includes(q))) score += 50;

      // Category match
      if (catN.includes(q)) score += 30;

      // Equipment match
      if (equipN.some((e) => e.includes(q))) score += 25;

      // Muscle name match
      const muscleNames = [...ex.primaryMuscles, ...ex.secondaryMuscles];
      const matchedMuscle = muscleNames.some((mId) => {
        const mg = MUSCLE_GROUPS.find((g) => g.id === mId);
        if (!mg) return false;
        const mgNameN = normalise(mg.name);
        return mgNameN.includes(q) || mg.aliases.some((a) => normalise(a).includes(q));
      });
      if (matchedMuscle) score += 20;

      // Token matching for multi-word queries
      if (score === 0) {
        const allText = [nameN, ...aliasesN, catN, ...equipN].join(' ');
        const matchedTokens = tokens.filter((t) => allText.includes(t));
        score += matchedTokens.length * 15;
      }

      return { exercise: ex, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.exercise);
}

/**
 * Get exercises by muscle group id.
 */
export function getExercisesForMuscle(muscleId: string): Exercise[] {
  return EXERCISES.filter(
    (ex) => ex.primaryMuscles.includes(muscleId) || ex.secondaryMuscles.includes(muscleId)
  );
}

/**
 * Get all parent (non-sub-group) muscles.
 */
export function getMajorMuscleGroups(): MuscleGroup[] {
  return MUSCLE_GROUPS.filter((m) => !m.parentId);
}

/**
 * Get sub-groups for a parent muscle.
 */
export function getSubGroups(parentId: string): MuscleGroup[] {
  return MUSCLE_GROUPS.filter((m) => m.parentId === parentId);
}
