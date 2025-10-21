const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres:NSiqTuorpCpxCqieQwFATSeLTKbPsJym@yamabiko.proxy.rlwy.net:18420/railway';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!');
    
    console.log('📄 Reading migration file...');
    const sql = fs.readFileSync('migrations/add-location-system.sql', 'utf8');
    
    console.log('🚀 Running location system migration...');
    const result = await client.query(sql);
    
    console.log('✅ Migration complete!');
    console.log('Result:', result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().then(() => {
  console.log('');
  console.log('🎉 Location system is now active!');
  console.log('Users will see permission modal when opening matchmaking.');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

