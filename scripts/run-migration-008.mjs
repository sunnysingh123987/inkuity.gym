#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Running migration 008_add_payments_table.sql...\n');

  const sql = readFileSync(join(__dirname, '..', 'migrations', '008_add_payments_table.sql'), 'utf8');

  const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).single();

  if (error) {
    // If exec_sql doesn't exist, try via REST API
    console.log('Note: exec_sql RPC not available. Please run the migration manually:');
    console.log('  1. Go to your Supabase dashboard SQL editor');
    console.log('  2. Paste the contents of migrations/008_add_payments_table.sql');
    console.log('  3. Run the SQL');
    console.log('\nAlternatively, the table may already exist. Trying a test insert...\n');

    // Test if table exists by trying to query it
    const { error: testError } = await supabase.from('payments').select('id').limit(1);
    if (testError) {
      console.error('Payments table does not exist. Please run the migration manually.');
      console.error('Error:', testError.message);
      process.exit(1);
    } else {
      console.log('Payments table already exists! You can proceed with seeding.\n');
    }
  } else {
    console.log('Migration applied successfully!\n');
  }
}

main().catch(console.error);
