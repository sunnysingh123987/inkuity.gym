#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// PIN Encryption (same as lib/actions/pin-auth.ts)
const ENCRYPTION_KEY = process.env.PIN_ENCRYPTION_KEY || 'default-key-change-in-production-32b';

function getEncryptionKey() {
  if (ENCRYPTION_KEY.length === 64) {
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  }
  return Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
}

function encryptPIN(pin) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let encrypted = cipher.update(pin, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function createTestMember() {
  console.log('🚀 Creating test member for portal testing\n');

  try {
    // 1. Find gym by slug
    console.log('📍 Finding gym with slug "gym-city"...');
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, slug')
      .eq('slug', 'gym-city')
      .single();

    if (gymError || !gym) {
      console.error('❌ Gym not found. Please create a gym with slug "gym-city" first.');
      console.log('\n💡 Tip: Go to http://localhost:3000/dashboard and create a gym');
      return;
    }

    console.log(`✅ Found gym: ${gym.name} (${gym.id})\n`);

    // 2. Check if member already exists
    const testEmail = 'kopit13073@manupay.com';
    console.log(`🔍 Checking if member ${testEmail} already exists...`);

    const { data: existingMember } = await supabase
      .from('members')
      .select('id, email, full_name')
      .eq('email', testEmail)
      .eq('gym_id', gym.id)
      .single();

    if (existingMember) {
      console.log(`✅ Member already exists: ${existingMember.full_name || 'No name'}`);
      console.log(`   ID: ${existingMember.id}\n`);

      // Update with encrypted PIN
      const encryptedPIN = encryptPIN('2255');
      await supabase
        .from('members')
        .update({
          portal_pin: encryptedPIN,
          pin_created_at: new Date().toISOString(),
          last_pin_sent_at: new Date().toISOString()
        })
        .eq('id', existingMember.id);

      console.log('🔑 Set PIN to 2255 (encrypted)\n');

      // Create some sample data for this member
      await createSampleData(existingMember.id, gym.id);
      return;
    }

    // 3. Create new member
    console.log('📝 Creating new member...');
    const { data: newMember, error: memberError } = await supabase
      .from('members')
      .insert({
        gym_id: gym.id,
        email: testEmail,
        full_name: 'Test Member',
        phone: '+1234567890',
        member_since: new Date().toISOString().split('T')[0],
        membership_tier: 'premium',
        membership_status: 'active',
        is_verified: true,
        metadata: {
          notification_preferences: {
            email_checkin: true,
            email_workout: true,
            email_diet: true,
            email_weekly_report: true
          }
        }
      })
      .select()
      .single();

    if (memberError) {
      console.error('❌ Failed to create member:', memberError.message);
      return;
    }

    console.log(`✅ Member created: ${newMember.full_name}`);
    console.log(`   ID: ${newMember.id}\n`);

    // Set encrypted PIN
    const encryptedPIN = encryptPIN('2255');
    await supabase
      .from('members')
      .update({
        portal_pin: encryptedPIN,
        pin_created_at: new Date().toISOString(),
        last_pin_sent_at: new Date().toISOString()
      })
      .eq('id', newMember.id);

    console.log('🔑 Set PIN to 2255 (encrypted)\n');

    // 4. Create sample check-ins
    await createSampleData(newMember.id, gym.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function createSampleData(memberId, gymId) {
  console.log('📊 Creating sample data...\n');

  try {
    // Create sample check-ins (last 7 days)
    console.log('✓ Creating check-in history...');
    const checkIns = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      checkIns.push({
        gym_id: gymId,
        member_id: memberId,
        check_in_at: date.toISOString(),
        check_out_at: new Date(date.getTime() + (60 + Math.random() * 60) * 60000).toISOString(),
      });
    }

    await supabase.from('check_ins').insert(checkIns);
    console.log(`  ✅ Created ${checkIns.length} check-ins\n`);

    // Create sample workout routine
    console.log('✓ Creating workout routine...');
    const { data: routine, error: routineError } = await supabase
      .from('workout_routines')
      .insert({
        gym_id: gymId,
        member_id: memberId,
        name: 'Full Body Workout',
        description: 'Complete full body routine for strength building',
        schedule: ['Monday', 'Wednesday', 'Friday'],
        is_active: true
      })
      .select()
      .single();

    if (routine) {
      console.log(`  ✅ Created routine: ${routine.name}\n`);

      // Add exercises to routine
      const exercises = [
        { name: 'Bench Press', category: 'Chest', sets: 4, reps: 10 },
        { name: 'Squats', category: 'Legs', sets: 4, reps: 12 },
        { name: 'Deadlifts', category: 'Back', sets: 3, reps: 8 },
        { name: 'Shoulder Press', category: 'Shoulders', sets: 3, reps: 10 }
      ];

      console.log('✓ Adding exercises...');
      for (const ex of exercises) {
        // Create exercise in library
        const { data: exercise } = await supabase
          .from('exercise_library')
          .insert({
            gym_id: gymId,
            name: ex.name,
            category: ex.category,
            is_custom: false
          })
          .select()
          .single();

        if (exercise) {
          // Add to routine
          await supabase
            .from('routine_exercises')
            .insert({
              routine_id: routine.id,
              exercise_id: exercise.id,
              order_index: exercises.indexOf(ex),
              sets: ex.sets,
              reps: ex.reps,
              rest_seconds: 90
            });
        }
      }
      console.log(`  ✅ Added ${exercises.length} exercises\n`);
    }

    // Create sample diet plan
    console.log('✓ Creating diet plan...');
    const { data: dietPlan, error: dietError } = await supabase
      .from('diet_plans')
      .insert({
        gym_id: gymId,
        member_id: memberId,
        name: 'Balanced Nutrition Plan',
        description: 'Balanced macro split for muscle building',
        target_calories: 2500,
        target_protein: 180,
        target_carbs: 250,
        target_fat: 80,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (dietPlan) {
      console.log(`  ✅ Created diet plan: ${dietPlan.name}\n`);

      // Add sample meals for today
      console.log('✓ Adding meals...');
      const today = new Date().toISOString().split('T')[0];
      const meals = [
        { type: 'breakfast', name: 'Oatmeal & Eggs', calories: 550, protein: 35, carbs: 65, fat: 15 },
        { type: 'lunch', name: 'Chicken & Rice', calories: 750, protein: 55, carbs: 85, fat: 18 },
        { type: 'dinner', name: 'Salmon & Vegetables', calories: 650, protein: 50, carbs: 45, fat: 28 },
        { type: 'snack', name: 'Protein Shake', calories: 350, protein: 40, carbs: 35, fat: 8 }
      ];

      for (const meal of meals) {
        const scheduledFor = new Date();
        if (meal.type === 'breakfast') scheduledFor.setHours(8, 0, 0);
        if (meal.type === 'lunch') scheduledFor.setHours(12, 30, 0);
        if (meal.type === 'dinner') scheduledFor.setHours(19, 0, 0);
        if (meal.type === 'snack') scheduledFor.setHours(15, 0, 0);

        await supabase
          .from('meal_plans')
          .insert({
            diet_plan_id: dietPlan.id,
            scheduled_for: scheduledFor.toISOString(),
            scheduled_date: today,
            meal_type: meal.type,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            completed: meal.type === 'breakfast' // Mark breakfast as completed
          });
      }
      console.log(`  ✅ Added ${meals.length} meals\n`);
    }

    console.log('🎉 Sample data created successfully!\n');
    console.log('📋 Summary:');
    console.log('   - 7 check-ins');
    console.log('   - 1 workout routine with 4 exercises');
    console.log('   - 1 diet plan with 4 meals');
    console.log('\n✅ Ready to test! Sign in with:');
    console.log('   Email: kopit13073@manupay.com');
    console.log('   PIN: 2255\n');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }
}

createTestMember();
