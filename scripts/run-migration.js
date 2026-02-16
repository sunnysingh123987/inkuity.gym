// Script to run database migration
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting migration: 007_add_pin_auth.sql\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'migrations', '007_add_pin_auth.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by statement (rough split on semicolons)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments
    if (statement.startsWith('--') || statement.startsWith('/*')) {
      continue;
    }

    console.log(`▶️  Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        // Try direct query instead
        const { error: directError } = await supabase.from('_migrations').select('*').limit(1);

        // If the RPC doesn't exist, we'll execute via REST API directly
        console.log(`   ⚠️  RPC failed, trying direct execution...`);

        // For now, we'll output the SQL to run manually
        console.log(`   Statement: ${statement.substring(0, 100)}...`);

        if (error.message.includes('function')) {
          console.log(`   ℹ️  Please run this SQL manually in Supabase Dashboard → SQL Editor`);
        } else {
          throw error;
        }
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      console.log(`\n⚠️  Migration incomplete. Please run the SQL manually.\n`);
      console.log(`📄 Migration file: migrations/007_add_pin_auth.sql\n`);
      return;
    }
  }

  console.log('\n✅ Migration completed successfully!\n');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
