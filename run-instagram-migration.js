#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres:NSiqTuorpCpxCqieQwFATSeLTKbPsJym@yamabiko.proxy.rlwy.net:18420/railway';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway\n');

    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'add-instagram-posts.sql'), 'utf8');
    console.log('Running migration...\n');
    
    await client.query(sql);
    
    console.log('✅ Migration complete!\n');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'instagram_posts'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ instagram_posts column verified:');
      console.table(result.rows);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().then(() => {
  console.log('\n✅ Instagram posts migration complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Failed:', err);
  process.exit(1);
});

