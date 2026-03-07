// ============================================================
// EXERCISE DATABASE
// Generated from exercises.xlsx — base exercises with equipment
// options as arrays. Equipment sub-menu in the UI lets users
// pick a variant when multiple options exist.
// ============================================================

export interface Exercise {
  id: string;
  name: string;
  muscles: string[];
  equipment: string[];
  category: string;
}

export const EXERCISES: Exercise[] = [
  // --- Biceps ---
  { id: '21s-bicep-curl', name: '21s Bicep Curl', muscles: ['biceps'], equipment: ['Barbell', 'Dumbbell'], category: 'biceps' },
  { id: 'bicep-curl', name: 'Bicep Curl', muscles: ['biceps'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'biceps' },
  { id: 'concentration-curl', name: 'Concentration Curl', muscles: ['biceps'], equipment: [], category: 'biceps' },
  { id: 'drag-curl', name: 'Drag Curl', muscles: ['biceps'], equipment: ['Dumbbell', 'Barbell', 'Machine'], category: 'biceps' },
  { id: 'ez-bar-biceps-curl', name: 'EZ Bar Biceps Curl', muscles: ['biceps'], equipment: [], category: 'biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscles: ['biceps'], equipment: ['Dumbbell', 'Machine'], category: 'biceps' },
  { id: 'overhead-cable-curl', name: 'Overhead Cable Curl', muscles: ['biceps'], equipment: [], category: 'biceps' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscles: ['biceps'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'biceps' },
  { id: 'reverse-curl', name: 'Reverse Curl', muscles: ['biceps'], equipment: ['Dumbbell', 'Barbell', 'Machine'], category: 'biceps' },
  { id: 'seated-incline-dumbbell-curl', name: 'Seated Incline Dumbbell Curl', muscles: ['biceps'], equipment: [], category: 'biceps' },
  { id: 'spider-curl', name: 'Spider Curl', muscles: ['biceps'], equipment: ['Dumbbell', 'Barbell'], category: 'biceps' },

  // --- Triceps ---
  { id: 'bench-dip', name: 'Bench Dip', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'bench-press-close-grip', name: 'Bench Press - Close Grip', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'diamond-push-up', name: 'Diamond Push Up', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'jm-press', name: 'JM Press', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'overhead-triceps-extension-cable', name: 'Overhead Triceps Extension Cable', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'seated-dip-machine', name: 'Seated Dip Machine', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'skullcrusher', name: 'Skullcrusher', muscles: ['triceps'], equipment: ['Dumbbell', 'Barbell', 'Machine'], category: 'triceps' },
  { id: 'triceps-dip', name: 'Triceps Dip', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'triceps-extension', name: 'Triceps Extension', muscles: ['triceps'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine', 'Kettlebell'], category: 'triceps' },
  { id: 'triceps-kickback', name: 'Triceps Kickback', muscles: ['triceps'], equipment: ['Machine', 'Dumbbell'], category: 'triceps' },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', muscles: ['triceps'], equipment: [], category: 'triceps' },
  { id: 'triceps-rope-pushdown', name: 'Triceps Rope Pushdown', muscles: ['triceps'], equipment: [], category: 'triceps' },

  // --- Chest ---
  { id: 'around-the-world', name: 'Around The World', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'bench-press', name: 'Bench Press', muscles: ['chest'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'chest' },
  { id: 'butterfly', name: 'Butterfly', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'cable-fly-crossovers', name: 'Cable Fly Crossovers', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'chest-dip', name: 'Chest Dip', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'chest-fly', name: 'Chest Fly', muscles: ['chest'], equipment: ['Dumbbell', 'Machine'], category: 'chest' },
  { id: 'decline-bench-press', name: 'Decline Bench Press', muscles: ['chest'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'chest' },
  { id: 'decline-chest-fly', name: 'Decline Chest Fly', muscles: ['chest'], equipment: ['Dumbbell', 'Machine'], category: 'chest' },
  { id: 'dumbbell-squeeze-press', name: 'Dumbbell Squeeze Press', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'hex-press', name: 'Hex Press', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'incline-bench-press', name: 'Incline Bench Press', muscles: ['chest'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'chest' },
  { id: 'incline-chest-fly', name: 'Incline Chest Fly', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'low-cable-fly-crossovers', name: 'Low Cable Fly Crossovers', muscles: ['chest'], equipment: [], category: 'chest' },
  { id: 'push-up', name: 'Push Up', muscles: ['chest'], equipment: [], category: 'chest' },

  // --- Back ---
  { id: 'bent-over-row', name: 'Bent Over Row', muscles: ['back'], equipment: ['Dumbbell', 'Barbell', 'Smith Machine'], category: 'back' },
  { id: 'chest-supported-incline-row', name: 'Chest Supported Incline Row', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'deadlift', name: 'Deadlift', muscles: ['back'], equipment: ['Dumbbell', 'Barbell', 'Smith Machine'], category: 'back' },
  { id: 'chin-up', name: 'Chin Up', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'dead-hang', name: 'Dead Hang', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'dumbbell-row', name: 'Dumbbell Row', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'hyperextension', name: 'Hyperextension', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'iso-lateral-high-row', name: 'Iso-Lateral High Row', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'iso-lateral-low-row', name: 'Iso-Lateral Low Row', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'iso-lateral-row', name: 'Iso-Lateral Row', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'landmine-row', name: 'Landmine Row', muscles: ['back'], equipment: ['Barbell', 'Machine'], category: 'back' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'pull-up', name: 'Pull Up', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'pullover', name: 'Pullover', muscles: ['back'], equipment: ['Dumbbell', 'Machine', 'Barbell'], category: 'back' },
  { id: 'rack-pull', name: 'Rack Pull', muscles: ['back'], equipment: ['Barbell', 'Smith Machine', 'Machine'], category: 'back' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'seated-row-machine', name: 'Seated Row (Machine)', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'straight-arm-lat-pulldown', name: 'Straight Arm Lat Pulldown', muscles: ['back'], equipment: [], category: 'back' },
  { id: 'superman', name: 'Superman', muscles: ['back'], equipment: [], category: 'back' },
  { id: 't-bar-row', name: 'T Bar Row', muscles: ['back'], equipment: [], category: 'back' },

  // --- Shoulders ---
  { id: 'arnold-press', name: 'Arnold Press', muscles: ['shoulders'], equipment: [], category: 'shoulders' },
  { id: 'chest-supported-reverse-fly', name: 'Chest Supported Reverse Fly', muscles: ['shoulders'], equipment: [], category: 'shoulders' },
  { id: 'face-pull', name: 'Face Pull', muscles: ['shoulders'], equipment: [], category: 'shoulders' },
  { id: 'front-raise', name: 'Front Raise', muscles: ['shoulders'], equipment: ['Dumbbell', 'Barbell', 'Machine'], category: 'shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscles: ['shoulders'], equipment: ['Dumbbell', 'Machine'], category: 'shoulders' },
  { id: 'rear-delt-reverse-fly', name: 'Rear Delt Reverse Fly', muscles: ['shoulders'], equipment: ['Dumbbell'], category: 'shoulders' },
  { id: 'shoulder-press', name: 'Shoulder Press', muscles: ['shoulders'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'shoulders' },
  { id: 'shrugs', name: 'Shrugs', muscles: ['shoulders'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'shoulders' },
  { id: 'standing-military-press', name: 'Standing Military Press', muscles: ['shoulders'], equipment: ['Dumbbell', 'Barbell'], category: 'shoulders' },
  { id: 'upright-row', name: 'Upright Row', muscles: ['shoulders'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'shoulders' },

  // --- Legs ---
  { id: 'belt-squat', name: 'Belt Squat', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'box-jump', name: 'Box Jump', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'box-squat', name: 'Box Squat', muscles: ['legs'], equipment: ['Dumbbell', 'Barbell', 'Smith Machine'], category: 'legs' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscles: ['legs'], equipment: ['Barbell', 'Dumbbell', 'Smith Machine'], category: 'legs' },
  { id: 'calf-press', name: 'Calf Press', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'dumbbell-step-up', name: 'Dumbbell Step Up', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'frog-jumps', name: 'Frog Jumps', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'frog-pumps', name: 'Frog Pumps', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'front-squat', name: 'Front Squat', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'glute-bridge', name: 'Glute Bridge', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'glute-kickback-machine', name: 'Glute Kickback (Machine)', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'goblet-squat', name: 'Goblet Squat', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'good-morning', name: 'Good Morning', muscles: ['legs'], equipment: ['Barbell', 'Machine', 'Smith Machine'], category: 'legs' },
  { id: 'hack-squat', name: 'Hack Squat', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'hip-abduction', name: 'Hip Abduction', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'hip-thrust', name: 'Hip Thrust', muscles: ['legs'], equipment: ['Barbell', 'Machine', 'Smith Machine'], category: 'legs' },
  { id: 'jump-squat', name: 'Jump Squat', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'jumping-lunge', name: 'Jumping Lunge', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'lateral-leg-raises', name: 'Lateral Leg Raises', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'leg-extension', name: 'Leg Extension', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'leg-press', name: 'Leg Press', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'lunges', name: 'Lunges', muscles: ['legs'], equipment: ['Dumbbell', 'Barbell', 'Smith Machine'], category: 'legs' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'pistol-squat', name: 'Pistol Squat', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscles: ['legs'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'legs' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'sissy-squat', name: 'Sissy Squat', muscles: ['legs'], equipment: ['Dumbbell', 'Machine', 'Smith Machine'], category: 'legs' },
  { id: 'squat', name: 'Squat', muscles: ['legs'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine', 'Kettlebell'], category: 'legs' },
  { id: 'standing-cable-glute-kickbacks', name: 'Standing Cable Glute Kickbacks', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscles: ['legs'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine'], category: 'legs' },
  { id: 'standing-leg-curls', name: 'Standing Leg Curls', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'step-up', name: 'Step Up', muscles: ['legs'], equipment: [], category: 'legs' },
  { id: 'sumo-squat', name: 'Sumo Squat', muscles: ['legs'], equipment: ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine', 'Kettlebell'], category: 'legs' },
  { id: 'wall-sit', name: 'Wall Sit', muscles: ['legs'], equipment: [], category: 'legs' },

  // --- Core / Abdominals ---
  { id: 'ab-scissors', name: 'Ab Scissors', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'ab-wheel', name: 'Ab Wheel', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'cable-twist', name: 'Cable Twist', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'crunch', name: 'Crunch', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'dead-bug', name: 'Dead Bug', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'decline-crunch', name: 'Decline Crunch', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'elbow-to-knee', name: 'Elbow to Knee', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'flutter-kicks', name: 'Flutter Kicks', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raise', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'heel-taps', name: 'Heel Taps', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'jackknife-sit-up', name: 'Jackknife Sit Up', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'knee-raise-parallel-bars', name: 'Knee Raise Parallel Bars', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'l-sit-hold', name: 'L-Sit Hold', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'landmine-180', name: 'Landmine 180', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'leg-raise-parallel-bars', name: 'Leg Raise Parallel Bars', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'lying-knee-raise', name: 'Lying Knee Raise', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'lying-leg-raise', name: 'Lying Leg Raise', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'oblique-crunch', name: 'Oblique Crunch', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'plank', name: 'Plank', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'reverse-crunch', name: 'Reverse Crunch', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'russian-twist', name: 'Russian Twist', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'side-bend', name: 'Side Bend', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'side-plank', name: 'Side Plank', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'sit-up', name: 'Sit Up', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'toe-touch', name: 'Toe Touch', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'toes-to-bar', name: 'Toes to Bar', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'torso-rotation', name: 'Torso Rotation', muscles: ['core'], equipment: [], category: 'core' },
  { id: 'v-up', name: 'V Up', muscles: ['core'], equipment: [], category: 'core' },

  // --- Full Body ---
  { id: 'burpee', name: 'Burpee', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'clean', name: 'Clean', muscles: ['full-body'], equipment: ['Dumbbell', 'Barbell', 'Kettlebell'], category: 'full-body' },
  { id: 'clean-and-jerk', name: 'Clean and Jerk', muscles: ['full-body'], equipment: ['Dumbbell', 'Barbell', 'Kettlebell'], category: 'full-body' },
  { id: 'clean-and-press', name: 'Clean and Press', muscles: ['full-body'], equipment: ['Dumbbell', 'Barbell', 'Kettlebell'], category: 'full-body' },
  { id: 'clean-pull', name: 'Clean Pull', muscles: ['full-body'], equipment: ['Dumbbell', 'Barbell', 'Kettlebell'], category: 'full-body' },
  { id: 'dumbbell-snatch', name: 'Dumbbell Snatch', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'farmers-walk', name: 'Farmers Walk', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'jumping-jack', name: 'Jumping Jack', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'jump-shrug', name: 'Jump Shrug', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'landmine-squat-and-press', name: 'Landmine Squat and Press', muscles: ['full-body'], equipment: ['Barbell', 'Machine'], category: 'full-body' },
  { id: 'mountain-climber', name: 'Mountain Climber', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'muscle-up', name: 'Muscle Up', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'power-clean', name: 'Power Clean', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'power-snatch', name: 'Power Snatch', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'snatch', name: 'Snatch', muscles: ['full-body'], equipment: [], category: 'full-body' },
  { id: 'thruster', name: 'Thruster', muscles: ['full-body'], equipment: ['Dumbbell', 'Barbell', 'Kettlebell'], category: 'full-body' },
  { id: 'yoga', name: 'Yoga', muscles: ['full-body'], equipment: [], category: 'full-body' },

  // --- Cardio ---
  { id: 'air-bike', name: 'Air Bike', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'battle-ropes', name: 'Battle Ropes', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'cycling', name: 'Cycling', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'elliptical-trainer', name: 'Elliptical Trainer', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'jump-rope', name: 'Jump Rope', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'rowing-machine', name: 'Rowing Machine', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'running', name: 'Running', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'stair-machine', name: 'Stair Machine', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'swimming', name: 'Swimming', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'treadmill', name: 'Treadmill', muscles: ['cardio'], equipment: [], category: 'cardio' },
  { id: 'walking', name: 'Walking', muscles: ['cardio'], equipment: [], category: 'cardio' },

  // --- Forearms ---
  { id: 'wrist-roller', name: 'Wrist Roller', muscles: ['forearms'], equipment: [], category: 'forearms' },
];

// ============================================================
// SEARCH
// ============================================================

/**
 * Search exercises by query string. Returns matching exercises sorted by relevance.
 */
export function searchExercises(query: string): Exercise[] {
  if (!query.trim()) return EXERCISES;

  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/);

  return EXERCISES
    .map((ex) => {
      const name = ex.name.toLowerCase();
      const cat = ex.category;
      const equip = ex.equipment.join(' ').toLowerCase();
      const musclesStr = ex.muscles.join(' ');

      let score = 0;

      // Exact name match
      if (name === q) score += 100;
      // Name starts with query
      else if (name.startsWith(q)) score += 80;
      // Name contains query
      else if (name.includes(q)) score += 60;
      // Category or muscle match
      else if (cat.includes(q) || musclesStr.includes(q)) score += 40;
      // Equipment match
      else if (equip.includes(q)) score += 30;
      // All tokens match somewhere
      else {
        const allText = `${name} ${cat} ${equip} ${musclesStr}`;
        const matchedTokens = tokens.filter((t) => allText.includes(t));
        score += matchedTokens.length * 15;
      }

      return { exercise: ex, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.exercise);
}
