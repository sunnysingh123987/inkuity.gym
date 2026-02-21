#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ENCRYPTION_KEY = process.env.PIN_ENCRYPTION_KEY || 'default-key-change-in-production-32b';

function getEncryptionKey() {
  if (ENCRYPTION_KEY.length === 64) return Buffer.from(ENCRYPTION_KEY, 'hex');
  return Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
}

function encryptPIN(pin) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let encrypted = cipher.update(pin, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const OWNER_EMAIL = 'vto57o4c9u@bwmyga.com';
const OWNER_PASSWORD = 'test123456';
const GYM_SLUG = 'gym-city';

// ─── STEP 1: CLEAR ALL DATA ───

async function clearAllData() {
  console.log('=== CLEARING ALL DATA ===\n');

  // Delete in dependency order (children first)
  const tables = [
    'meal_plans',
    'diet_plans',
    'exercise_sets',
    'session_exercises',
    'workout_sessions',
    'routine_exercises',
    'workout_routines',
    'exercise_library',
    'check_ins',
    'scans',
    'daily_analytics',
    'webhook_events',
    'notifications',
    'qr_codes',
    'members',
    'gyms',
    'profiles',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.log(`  Warning clearing ${table}: ${error.message}`);
    } else {
      console.log(`  Cleared ${table}`);
    }
  }

  // Delete all auth users
  console.log('\n  Deleting auth users...');
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.log(`  Warning listing users: ${listErr.message}`);
  } else if (users && users.length > 0) {
    for (const user of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) console.log(`  Warning deleting user ${user.email}: ${delErr.message}`);
      else console.log(`  Deleted auth user: ${user.email}`);
    }
  } else {
    console.log('  No auth users to delete');
  }

  console.log('\nAll data cleared.\n');
}

// ─── STEP 2: CREATE OWNER + GYM ───

async function createOwnerAndGym() {
  console.log('=== CREATING OWNER & GYM ===\n');

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
  });

  if (authErr) {
    console.error('Failed to create auth user:', authErr.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`  Auth user created: ${OWNER_EMAIL} (${userId})`);

  // Update profile (auto-created by trigger on auth user creation)
  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    email: OWNER_EMAIL,
    full_name: 'Prithvi Test',
    phone: '+1 555 000 1234',
    company_name: 'Gym City',
    subscription_tier: 'pro',
    subscription_status: 'active',
    onboarding_completed: true,
  });

  if (profileErr) {
    console.error('Failed to update profile:', profileErr.message);
    process.exit(1);
  }
  console.log('  Profile created');

  // Create gym
  const { data: gym, error: gymErr } = await supabase.from('gyms').insert({
    owner_id: userId,
    name: 'Gym City',
    slug: GYM_SLUG,
    description: 'Premium fitness center with state-of-the-art equipment',
    address: '123 Fitness Avenue',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    country: 'US',
    phone: '+1 555 000 5678',
    email: OWNER_EMAIL,
    timezone: 'America/New_York',
    currency: 'USD',
    is_active: true,
  }).select().single();

  if (gymErr) {
    console.error('Failed to create gym:', gymErr.message);
    process.exit(1);
  }
  console.log(`  Gym created: ${gym.name} (${gym.id})\n`);

  // Create QR code
  const { data: qr } = await supabase.from('qr_codes').insert({
    gym_id: gym.id,
    code: `gym-city-checkin-${Date.now()}`,
    name: 'Main Entrance Check-in',
    label: 'Scan to check in',
    type: 'check-in',
    is_active: true,
  }).select().single();

  if (qr) console.log(`  QR code created: ${qr.name}\n`);

  return { userId, gymId: gym.id, qrCodeId: qr?.id };
}

// ─── STEP 3: CREATE MEMBERS ───

const MEMBER_DATA = [
  { full_name: 'Alex Johnson', email: 'alex.j@test.com', phone: '+1 555 101 0001', gender: 'male', status: 'active', plan: '3_months', birth_date: '1995-03-15' },
  { full_name: 'Maria Garcia', email: 'maria.g@test.com', phone: '+1 555 101 0002', gender: 'female', status: 'active', plan: '1_year', birth_date: '1992-07-22' },
  { full_name: 'James Wilson', email: 'james.w@test.com', phone: '+1 555 101 0003', gender: 'male', status: 'active', plan: '6_months', birth_date: '1988-11-03' },
  { full_name: 'Emily Chen', email: 'emily.c@test.com', phone: '+1 555 101 0004', gender: 'female', status: 'active', plan: '1_month', birth_date: '1998-01-30' },
  { full_name: 'David Brown', email: 'david.b@test.com', phone: '+1 555 101 0005', gender: 'male', status: 'active', plan: '3_months', birth_date: '1990-06-18' },
  { full_name: 'Sarah Miller', email: 'sarah.m@test.com', phone: '+1 555 101 0006', gender: 'female', status: 'trial', plan: null, birth_date: '2000-09-05' },
  { full_name: 'Michael Davis', email: 'michael.d@test.com', phone: '+1 555 101 0007', gender: 'male', status: 'trial', plan: null, birth_date: '1997-12-11' },
  { full_name: 'Lisa Anderson', email: 'lisa.a@test.com', phone: '+1 555 101 0008', gender: 'female', status: 'expired', plan: '1_month', birth_date: '1993-04-25' },
  { full_name: 'Robert Taylor', email: 'robert.t@test.com', phone: '+1 555 101 0009', gender: 'male', status: 'expired', plan: '3_months', birth_date: '1985-08-14' },
  { full_name: 'Jennifer Lee', email: 'jennifer.l@test.com', phone: '+1 555 101 0010', gender: 'female', status: 'cancelled', plan: '6_months', birth_date: '1991-02-28' },
  { full_name: 'Daniel Martinez', email: 'daniel.m@test.com', phone: '+1 555 101 0011', gender: 'male', status: 'active', plan: '1_year', birth_date: '1994-10-07' },
  { full_name: 'Amanda White', email: 'amanda.w@test.com', phone: '+1 555 101 0012', gender: 'female', status: 'active', plan: '3_months', birth_date: '1996-05-19' },
];

function getPlanDates(plan, status) {
  const now = new Date();
  const start = new Date(now);

  if (!plan) return { start: null, end: null };

  const months = { '1_month': 1, '3_months': 3, '6_months': 6, '1_year': 12 };
  const m = months[plan] || 1;

  if (status === 'expired') {
    start.setMonth(start.getMonth() - m - 1);
  } else if (status === 'cancelled') {
    start.setMonth(start.getMonth() - 2);
  } else {
    start.setMonth(start.getMonth() - Math.floor(m / 2));
  }

  const end = new Date(start);
  end.setMonth(end.getMonth() + m);

  return { start: start.toISOString(), end: end.toISOString() };
}

async function createMembers(gymId) {
  console.log('=== CREATING MEMBERS ===\n');

  const memberIds = [];

  for (const m of MEMBER_DATA) {
    const { start, end } = getPlanDates(m.plan, m.status);

    const metadata = {
      height_ft: randomInt(5, 6),
      height_in: randomInt(0, 11),
      weight: `${randomInt(55, 95)}`,
      emergency_contact_name: `${m.full_name.split(' ')[0]}'s Emergency`,
      emergency_contact_phone: '+1 555 999 ' + String(randomInt(1000, 9999)),
    };

    if (Math.random() > 0.7) {
      metadata.medical_conditions = ['Mild asthma', 'Previous knee injury', 'Diabetes Type 2', 'None noted'][randomInt(0, 3)];
    }

    const { data: member, error } = await supabase.from('members').insert({
      gym_id: gymId,
      email: m.email,
      phone: m.phone,
      full_name: m.full_name,
      member_since: new Date(Date.now() - randomInt(7, 60) * 86400000).toISOString().split('T')[0],
      membership_tier: m.plan ? 'premium' : 'visitor',
      birth_date: m.birth_date,
      gender: m.gender,
      metadata,
      is_verified: m.status === 'active',
      membership_status: m.status,
      subscription_plan: m.plan,
      subscription_start_date: start,
      portal_pin: encryptPIN('1234'),
      pin_created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.log(`  Warning creating ${m.full_name}: ${error.message}`);
    } else {
      memberIds.push({ id: member.id, name: m.full_name, status: m.status });
      console.log(`  Created: ${m.full_name} (${m.status})`);
    }
  }

  console.log(`\n  Total members: ${memberIds.length}\n`);
  return memberIds;
}

// ─── STEP 4: CREATE CHECK-INS & SCANS ───

async function createCheckInsAndScans(gymId, qrCodeId, members) {
  console.log('=== CREATING CHECK-INS & SCANS (30 days) ===\n');

  const activeMembers = members.filter(m => m.status === 'active' || m.status === 'trial');
  const allCheckIns = [];
  const allScans = [];

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const day = new Date();
    day.setDate(day.getDate() - dayOffset);
    day.setHours(0, 0, 0, 0);

    // Each active member checks in 3-6 days/week
    for (const member of activeMembers) {
      // Skip some days randomly (simulate ~5 days/week)
      if (Math.random() < 0.3) continue;

      const hour = randomInt(6, 20);
      const minute = randomInt(0, 59);
      const checkInTime = new Date(day);
      checkInTime.setHours(hour, minute, 0, 0);

      const durationMin = randomInt(30, 120);
      const checkOutTime = new Date(checkInTime.getTime() + durationMin * 60000);

      const tags = [];
      const possibleTags = ['strength', 'cardio', 'flexibility', 'HIIT', 'yoga', 'crossfit'];
      tags.push(possibleTags[randomInt(0, possibleTags.length - 1)]);
      if (Math.random() > 0.5) tags.push(possibleTags[randomInt(0, possibleTags.length - 1)]);

      allCheckIns.push({
        gym_id: gymId,
        member_id: member.id,
        qr_code_id: qrCodeId,
        check_in_at: checkInTime.toISOString(),
        check_out_at: checkOutTime.toISOString(),
        tags: [...new Set(tags)],
      });

      allScans.push({
        gym_id: gymId,
        member_id: member.id,
        qr_code_id: qrCodeId,
        scanned_at: checkInTime.toISOString(),
        scan_type: 'check-in',
        device_type: ['mobile', 'tablet'][randomInt(0, 1)],
        browser: ['Chrome', 'Safari', 'Firefox'][randomInt(0, 2)],
        os: ['Android', 'iOS'][randomInt(0, 1)],
        city: 'New York',
        country: 'US',
        converted: true,
        conversion_type: 'check-in',
      });
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < allCheckIns.length; i += 100) {
    const batch = allCheckIns.slice(i, i + 100);
    const { error } = await supabase.from('check_ins').insert(batch);
    if (error) console.log(`  Check-in batch error: ${error.message}`);
  }
  console.log(`  Created ${allCheckIns.length} check-ins`);

  for (let i = 0; i < allScans.length; i += 100) {
    const batch = allScans.slice(i, i + 100);
    const { error } = await supabase.from('scans').insert(batch);
    if (error) console.log(`  Scan batch error: ${error.message}`);
  }
  console.log(`  Created ${allScans.length} scans\n`);

  return allCheckIns;
}

// ─── STEP 5: EXERCISES, ROUTINES, WORKOUT SESSIONS ───

const EXERCISES = [
  { name: 'Bench Press', category: 'Chest', equipment: ['barbell', 'bench'] },
  { name: 'Squats', category: 'Legs', equipment: ['barbell', 'squat rack'] },
  { name: 'Deadlifts', category: 'Back', equipment: ['barbell'] },
  { name: 'Shoulder Press', category: 'Shoulders', equipment: ['dumbbells'] },
  { name: 'Barbell Rows', category: 'Back', equipment: ['barbell'] },
  { name: 'Leg Press', category: 'Legs', equipment: ['leg press machine'] },
  { name: 'Bicep Curls', category: 'Arms', equipment: ['dumbbells'] },
  { name: 'Tricep Pushdowns', category: 'Arms', equipment: ['cable machine'] },
  { name: 'Lat Pulldowns', category: 'Back', equipment: ['cable machine'] },
  { name: 'Lunges', category: 'Legs', equipment: ['dumbbells'] },
  { name: 'Plank', category: 'Core', equipment: [] },
  { name: 'Russian Twists', category: 'Core', equipment: ['medicine ball'] },
];

async function createExercisesAndRoutines(gymId, members) {
  console.log('=== CREATING EXERCISES & ROUTINES ===\n');

  // Create exercise library
  const exerciseIds = [];
  for (const ex of EXERCISES) {
    const { data, error } = await supabase.from('exercise_library').insert({
      gym_id: gymId,
      name: ex.name,
      category: ex.category,
      equipment: ex.equipment,
      is_custom: false,
    }).select('id').single();

    if (data) exerciseIds.push(data.id);
    if (error) console.log(`  Exercise error (${ex.name}): ${error.message}`);
  }
  console.log(`  Created ${exerciseIds.length} exercises in library`);

  // Create routines for active members
  const activeMembers = members.filter(m => m.status === 'active');
  const routineMap = {}; // memberId -> [routineId, ...]

  const routineTemplates = [
    { name: 'Push Day', description: 'Chest, shoulders, triceps', schedule: ['Monday', 'Thursday'], exerciseIndices: [0, 3, 7] },
    { name: 'Pull Day', description: 'Back, biceps', schedule: ['Tuesday', 'Friday'], exerciseIndices: [2, 4, 6, 8] },
    { name: 'Leg Day', description: 'Quads, hamstrings, glutes', schedule: ['Wednesday', 'Saturday'], exerciseIndices: [1, 5, 9] },
    { name: 'Full Body', description: 'Complete full body workout', schedule: ['Monday', 'Wednesday', 'Friday'], exerciseIndices: [0, 1, 2, 3, 4] },
  ];

  for (const member of activeMembers) {
    // Assign 1-2 routines per member
    const numRoutines = randomInt(1, 2);
    const shuffled = [...routineTemplates].sort(() => Math.random() - 0.5);
    routineMap[member.id] = [];

    for (let r = 0; r < numRoutines; r++) {
      const tmpl = shuffled[r];
      const { data: routine, error } = await supabase.from('workout_routines').insert({
        gym_id: gymId,
        member_id: member.id,
        name: tmpl.name,
        description: tmpl.description,
        schedule: tmpl.schedule,
        is_active: true,
      }).select().single();

      if (error) {
        console.log(`  Routine error: ${error.message}`);
        continue;
      }

      routineMap[member.id].push(routine.id);

      // Add exercises to routine
      for (let i = 0; i < tmpl.exerciseIndices.length; i++) {
        const exIdx = tmpl.exerciseIndices[i];
        if (exIdx < exerciseIds.length) {
          await supabase.from('routine_exercises').insert({
            routine_id: routine.id,
            exercise_id: exerciseIds[exIdx],
            order_index: i,
            sets: randomInt(3, 5),
            reps: randomInt(8, 15),
            rest_seconds: randomInt(60, 120),
          });
        }
      }
    }
  }

  console.log(`  Created routines for ${activeMembers.length} active members`);

  // Create workout sessions for last 30 days
  console.log('\n  Creating workout sessions...');
  let sessionCount = 0;

  for (const member of activeMembers) {
    const routines = routineMap[member.id] || [];
    if (routines.length === 0) continue;

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      // ~4 workouts/week
      if (Math.random() < 0.4) continue;

      const day = new Date();
      day.setDate(day.getDate() - dayOffset);
      const hour = randomInt(6, 19);
      day.setHours(hour, randomInt(0, 59), 0, 0);

      const duration = randomInt(30, 90);
      const completed = new Date(day.getTime() + duration * 60000);

      const routineId = routines[randomInt(0, routines.length - 1)];

      const { data: session, error } = await supabase.from('workout_sessions').insert({
        gym_id: gymId,
        member_id: member.id,
        routine_id: routineId,
        started_at: day.toISOString(),
        completed_at: completed.toISOString(),
        duration_minutes: duration,
        status: 'completed',
      }).select().single();

      if (error) continue;
      sessionCount++;

      // Add 3-5 session exercises with sets
      const numExercises = randomInt(3, 5);
      for (let i = 0; i < numExercises && i < exerciseIds.length; i++) {
        const exId = exerciseIds[randomInt(0, exerciseIds.length - 1)];
        const { data: sessionEx } = await supabase.from('session_exercises').insert({
          session_id: session.id,
          exercise_id: exId,
          order_index: i,
          completed: true,
        }).select().single();

        if (sessionEx) {
          const numSets = randomInt(3, 5);
          const sets = [];
          for (let s = 0; s < numSets; s++) {
            sets.push({
              session_exercise_id: sessionEx.id,
              set_number: s + 1,
              weight: randomInt(20, 100),
              reps: randomInt(6, 15),
              completed: true,
            });
          }
          await supabase.from('exercise_sets').insert(sets);
        }
      }
    }
  }

  console.log(`  Created ${sessionCount} workout sessions with exercises & sets\n`);
  return exerciseIds;
}

// ─── STEP 6: DIET PLANS & MEALS ───

async function createDietPlans(gymId, members) {
  console.log('=== CREATING DIET PLANS & MEALS ===\n');

  const activeMembers = members.filter(m => m.status === 'active').slice(0, 6);
  const mealTemplates = {
    breakfast: [
      { name: 'Oatmeal & Eggs', calories: 550, protein: 35, carbs: 65, fat: 15 },
      { name: 'Protein Pancakes', calories: 480, protein: 40, carbs: 55, fat: 12 },
      { name: 'Greek Yogurt Bowl', calories: 420, protein: 30, carbs: 50, fat: 10 },
    ],
    lunch: [
      { name: 'Chicken & Rice', calories: 750, protein: 55, carbs: 85, fat: 18 },
      { name: 'Turkey Wrap', calories: 620, protein: 45, carbs: 60, fat: 22 },
      { name: 'Quinoa Salad Bowl', calories: 580, protein: 35, carbs: 70, fat: 16 },
    ],
    dinner: [
      { name: 'Salmon & Vegetables', calories: 650, protein: 50, carbs: 45, fat: 28 },
      { name: 'Steak & Sweet Potato', calories: 720, protein: 55, carbs: 60, fat: 25 },
      { name: 'Grilled Chicken Pasta', calories: 680, protein: 48, carbs: 75, fat: 20 },
    ],
    snack: [
      { name: 'Protein Shake', calories: 350, protein: 40, carbs: 35, fat: 8 },
      { name: 'Trail Mix', calories: 280, protein: 12, carbs: 30, fat: 16 },
      { name: 'Apple & Peanut Butter', calories: 300, protein: 10, carbs: 35, fat: 14 },
    ],
  };

  let planCount = 0;

  for (const member of activeMembers) {
    const targetCal = randomInt(2000, 3000);
    const { data: plan, error } = await supabase.from('diet_plans').insert({
      gym_id: gymId,
      member_id: member.id,
      name: ['Lean Bulk Plan', 'Cut Phase', 'Maintenance Plan', 'High Protein Plan'][randomInt(0, 3)],
      description: 'Personalized nutrition plan',
      target_calories: targetCal,
      target_protein: Math.round(targetCal * 0.3 / 4),
      target_carbs: Math.round(targetCal * 0.4 / 4),
      target_fat: Math.round(targetCal * 0.3 / 9),
      is_active: true,
      start_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    }).select().single();

    if (error || !plan) continue;
    planCount++;

    // Create meals for last 7 days
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const day = new Date();
      day.setDate(day.getDate() - dayOffset);
      const dateStr = day.toISOString().split('T')[0];

      for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
        const options = mealTemplates[mealType];
        const meal = options[randomInt(0, options.length - 1)];
        const hours = { breakfast: 8, lunch: 12, dinner: 19, snack: 15 };

        const scheduledFor = new Date(day);
        scheduledFor.setHours(hours[mealType], randomInt(0, 30), 0, 0);

        await supabase.from('meal_plans').insert({
          diet_plan_id: plan.id,
          scheduled_for: scheduledFor.toISOString(),
          scheduled_date: dateStr,
          meal_type: mealType,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          completed: dayOffset > 0 || mealType === 'breakfast',
        });
      }
    }
  }

  console.log(`  Created ${planCount} diet plans with meals\n`);
}

// ─── STEP 7: DAILY ANALYTICS ───

async function createDailyAnalytics(gymId) {
  console.log('=== CREATING DAILY ANALYTICS ===\n');

  const analytics = [];

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const day = new Date();
    day.setDate(day.getDate() - dayOffset);
    const dateStr = day.toISOString().split('T')[0];

    const totalScans = randomInt(15, 45);
    const uniqueVisitors = randomInt(8, Math.min(totalScans, 12));
    const peakHour = randomInt(7, 19);

    const scansByHour = {};
    for (let h = 6; h <= 21; h++) {
      scansByHour[h] = h === peakHour ? randomInt(5, 10) : randomInt(0, 4);
    }

    analytics.push({
      gym_id: gymId,
      date: dateStr,
      total_scans: totalScans,
      unique_visitors: uniqueVisitors,
      new_members: randomInt(0, 2),
      returning_members: uniqueVisitors - randomInt(0, 2),
      peak_hour: peakHour,
      scans_by_hour: scansByHour,
      top_device: ['mobile', 'tablet'][randomInt(0, 1)],
      devices_breakdown: { mobile: randomInt(60, 80), tablet: randomInt(10, 25), desktop: randomInt(5, 15) },
      top_city: 'New York',
      cities_breakdown: { 'New York': randomInt(70, 90), 'Brooklyn': randomInt(5, 15), 'Queens': randomInt(3, 10) },
      conversions: randomInt(3, 10),
      conversion_rate: randomInt(20, 65) / 100,
    });
  }

  const { error } = await supabase.from('daily_analytics').insert(analytics);
  if (error) console.log(`  Analytics error: ${error.message}`);
  else console.log(`  Created ${analytics.length} days of analytics\n`);
}

// ─── STEP 8: NOTIFICATIONS ───

async function createNotifications(gymId, userId, members) {
  console.log('=== CREATING NOTIFICATIONS ===\n');

  const notifications = [];
  const trialMembers = members.filter(m => m.status === 'trial');
  const activeMembers = members.filter(m => m.status === 'active');

  // Trial check-in notifications
  for (const m of trialMembers) {
    const daysAgo = randomInt(1, 5);
    notifications.push({
      gym_id: gymId,
      user_id: userId,
      type: 'trial_checkin',
      title: 'Trial Member Check-in',
      message: `${m.name} checked in as a trial member`,
      metadata: { member_id: m.id, member_name: m.name },
      is_read: Math.random() > 0.5,
      created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    });
  }

  // Subscription expiry notifications
  for (const m of activeMembers.slice(0, 3)) {
    notifications.push({
      gym_id: gymId,
      user_id: userId,
      type: 'subscription_expiring',
      title: 'Subscription Expiring Soon',
      message: `${m.name}'s subscription expires in 3 days`,
      metadata: { member_id: m.id, member_name: m.name },
      is_read: false,
      created_at: new Date(Date.now() - randomInt(0, 2) * 86400000).toISOString(),
    });
  }

  // New member notification
  notifications.push({
    gym_id: gymId,
    user_id: userId,
    type: 'new_member',
    title: 'New Member Joined',
    message: 'Amanda White has been added as a new member',
    metadata: {},
    is_read: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  });

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) console.log(`  Notification error: ${error.message}`);
  else console.log(`  Created ${notifications.length} notifications\n`);
}

// ─── MAIN ───

async function main() {
  console.log('========================================');
  console.log('  INKUITY SEED SCRIPT');
  console.log('========================================\n');

  await clearAllData();
  const { userId, gymId, qrCodeId } = await createOwnerAndGym();
  const members = await createMembers(gymId);
  await createCheckInsAndScans(gymId, qrCodeId, members);
  await createExercisesAndRoutines(gymId, members);
  await createDietPlans(gymId, members);
  await createDailyAnalytics(gymId);
  await createNotifications(gymId, userId, members);

  console.log('========================================');
  console.log('  SEED COMPLETE!');
  console.log('========================================\n');
  console.log('  Owner login:');
  console.log(`    Email: ${OWNER_EMAIL}`);
  console.log(`    Password: ${OWNER_PASSWORD}\n`);
  console.log('  Member portal PIN: 1234 (all members)');
  console.log(`  Gym URL: /${GYM_SLUG}\n`);
  console.log(`  Members: ${members.length}`);
  console.log(`    Active: ${members.filter(m => m.status === 'active').length}`);
  console.log(`    Trial: ${members.filter(m => m.status === 'trial').length}`);
  console.log(`    Expired: ${members.filter(m => m.status === 'expired').length}`);
  console.log(`    Cancelled: ${members.filter(m => m.status === 'cancelled').length}\n`);
}

main().catch(console.error);
