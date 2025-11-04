/**
 * Migration: Add ON DELETE CASCADE to usc_card_registrations
 * Run this once on production database
 */

const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Check existing constraint
    const checkResult = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'usc_card_registrations'::regclass
      AND conname = 'usc_card_registrations_user_id_fkey'
    `);

    if (checkResult.rows.length > 0) {
      console.log('Current constraint:', checkResult.rows[0].definition);
    }

    // Step 2: Drop existing foreign key
    console.log('Dropping existing foreign key...');
    await client.query(`
      ALTER TABLE usc_card_registrations 
      DROP CONSTRAINT IF EXISTS usc_card_registrations_user_id_fkey
    `);
    console.log('✅ Dropped old constraint');

    // Step 3: Add new foreign key with CASCADE
    console.log('Adding new foreign key with ON DELETE CASCADE...');
    await client.query(`
      ALTER TABLE usc_card_registrations
      ADD CONSTRAINT usc_card_registrations_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(user_id) 
      ON DELETE CASCADE
    `);
    console.log('✅ Added new constraint with CASCADE');

    // Step 4: Verify
    const verifyResult = await client.query(`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'usc_card_registrations'::regclass
      AND conname = 'usc_card_registrations_user_id_fkey'
    `);
    
    console.log('New constraint:', verifyResult.rows[0]?.definition);
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('USC cards will now be freed when users are deleted.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);

