#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const dbPassword = process.env.SUPABASE_DATABASE_PASS;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!dbPassword || !supabaseUrl) {
  console.error('❌ Missing database credentials in .env file');
  console.error('   Required: SUPABASE_DATABASE_PASS, NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from Supabase URL');
  process.exit(1);
}

// Construct PostgreSQL connection string
const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('🔌 Connecting to Supabase PostgreSQL database...');
console.log(`   Project: ${projectRef}\n`);

const client = new Client({ connectionString });

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🚀 Running migration: 007_add_pin_auth.sql\n');

    // Read migration file
    const migrationPath = join(__dirname, '..', 'migrations', '007_add_pin_auth.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute the entire migration
    await client.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Verify columns were added
    console.log('🔍 Verifying migration...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'members'
        AND column_name IN ('portal_pin', 'pin_created_at', 'last_pin_sent_at')
      ORDER BY column_name;
    `);

    if (result.rows.length === 3) {
      console.log('✅ All 3 columns verified:\n');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name} (${row.data_type})`);
      });
      console.log('');
    } else {
      console.log(`⚠️  Expected 3 columns, found ${result.rows.length}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📝 Details:', error);
    return false;
  } finally {
    await client.end();
  }
}

runMigration().then(success => {
  if (success) {
    console.log('🎉 Migration complete! You can now test the PIN authentication.\n');
  } else {
    console.log('\n⚠️  Please run the migration manually in Supabase Dashboard');
    console.log('   See: MIGRATION_INSTRUCTIONS.md\n');
  }
  process.exit(success ? 0 : 1);
});
