/**
 * Migration: Fix referral foreign keys to allow user deletion
 * Run this on production database
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

    // Step 1: Drop old constraints
    console.log('Dropping old foreign key constraints...');
    await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_introduced_to_fkey`);
    await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_introduced_by_fkey`);
    await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referred_by_fkey`);
    console.log('✅ Dropped old constraints');

    // Step 2: Add new constraints with SET NULL
    console.log('Adding new constraints with ON DELETE SET NULL...');
    
    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_introduced_to_fkey 
      FOREIGN KEY (introduced_to) 
      REFERENCES users(user_id) 
      ON DELETE SET NULL
    `);
    console.log('✅ Added users_introduced_to_fkey');
    
    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_introduced_by_fkey 
      FOREIGN KEY (introduced_by) 
      REFERENCES users(user_id) 
      ON DELETE SET NULL
    `);
    console.log('✅ Added users_introduced_by_fkey');
    
    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_referred_by_fkey 
      FOREIGN KEY (referred_by) 
      REFERENCES users(user_id) 
      ON DELETE SET NULL
    `);
    console.log('✅ Added users_referred_by_fkey');

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('Users can now be deleted even if they introduced others.');
    console.log('Referral info will be set to NULL gracefully.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);

