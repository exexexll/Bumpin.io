#!/usr/bin/env node

/**
 * Run Dual-Storage Migration via Node.js
 * No psql required - uses node-postgres (pg)
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres:NSiqTuorpCpxCqieQwFATSeLTKbPsJym@yamabiko.proxy.rlwy.net:18420/railway';

async function runMigration() {
  console.log('🔄 Running Dual-Storage Migration...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Railway requires SSL
    }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration file (migrations folder is in parent directory)
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-active-rooms-and-referrals.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration SQL...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('active_rooms', 'referral_mappings', 'text_room_activity', 'rate_limits')
      ORDER BY table_name
    `);

    console.log(`✅ Found ${result.rows.length} new tables:`);
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Restart your Railway server');
    console.log('  2. Check logs for: [Recovery] Loaded X active rooms');
    console.log('  3. Active calls will now survive server restarts\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

