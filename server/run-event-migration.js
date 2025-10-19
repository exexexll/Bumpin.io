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
    console.log('🔌 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('\n📝 Running event-migration.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'event-migration.sql'), 'utf8');
    
    await client.query(sql);
    console.log('✅ Migration successful!');

    console.log('\n🔍 Verifying tables...');
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'event%' ORDER BY tablename"
    );
    
    console.log('Event tables created:');
    tables.rows.forEach(t => console.log('  ✅', t.tablename));

    const settings = await client.query('SELECT * FROM event_settings');
    console.log('\n📊 Default settings:');
    console.log('  Mode enabled:', settings.rows[0].event_mode_enabled);
    console.log('  Start time:', settings.rows[0].event_start_time);
    console.log('  End time:', settings.rows[0].event_end_time);
    console.log('  Timezone:', settings.rows[0].timezone);

    console.log('\n🎉 Event Mode database ready!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

