#!/usr/bin/env node
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

console.log('🚀 Running PIN Authentication Migration via Supabase API\n');

// Read migration file
const migrationPath = join(__dirname, '..', 'migrations', '007_add_pin_auth.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

// Split into individual statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function runMigration() {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'; // Add semicolon back
    console.log(`▶️  Statement ${i + 1}/${statements.length}...`);

    try {
      await executeSQL(statement);
      console.log(`   ✅ Success`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failCount++;

      if (error.message.includes('not found') || error.message.includes('404')) {
        console.log(`\n⚠️  SQL execution via API not available.`);
        console.log(`   Please run migration manually in Supabase Dashboard.\n`);
        console.log(`📋 Steps:`);
        console.log(`   1. Go to https://supabase.com/dashboard`);
        console.log(`   2. Select your project`);
        console.log(`   3. Click "SQL Editor" in sidebar`);
        console.log(`   4. Copy the SQL from: migrations/007_add_pin_auth.sql`);
        console.log(`   5. Paste and click "Run"\n`);
        return false;
      }
    }
  }

  console.log(`\n📊 Results: ${successCount} successful, ${failCount} failed\n`);

  if (failCount === 0) {
    console.log('✅ Migration completed successfully!\n');
    return true;
  } else {
    console.log('⚠️  Some statements failed. Please check manually.\n');
    return false;
  }
}

runMigration().then(success => {
  process.exit(success ? 0 : 1);
});
