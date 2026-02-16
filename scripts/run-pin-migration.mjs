#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`   URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running PIN Authentication Migration\n');

  try {
    // Step 1: Add columns to members table
    console.log('📝 Step 1: Adding PIN columns to members table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.members
        ADD COLUMN IF NOT EXISTS portal_pin TEXT,
        ADD COLUMN IF NOT EXISTS pin_created_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_pin_sent_at TIMESTAMPTZ;
      `
    });

    if (alterError) {
      console.log('   ⚠️  Note: Direct SQL execution requires manual setup');
      console.log('   ℹ️  Please run the migration SQL in Supabase Dashboard → SQL Editor\n');
      console.log('   📄 File: migrations/007_add_pin_auth.sql\n');
      return false;
    }

    console.log('   ✅ Columns added successfully\n');

    // Step 2: Create index
    console.log('📝 Step 2: Creating index...');
    console.log('   ✅ Will be created via migration file\n');

    // Step 3: Update RLS policies
    console.log('📝 Step 3: Updating RLS policies...');
    console.log('   ✅ Will be updated via migration file\n');

    console.log('✅ Migration steps prepared!\n');
    console.log('⚠️  To complete the migration, run this SQL in Supabase Dashboard:\n');

    const migrationPath = join(__dirname, '..', 'migrations', '007_add_pin_auth.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('\n📍 Go to: https://supabase.com/dashboard → Your Project → SQL Editor');
    console.log('📋 Copy the SQL above and execute it\n');

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

runMigration().then(success => {
  process.exit(success ? 0 : 1);
});
