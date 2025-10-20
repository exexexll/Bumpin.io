#!/bin/bash
# Run Event Custom Text Migration
# This connects to Railway PostgreSQL and runs the migration

echo "🔧 Running event custom text migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set!"
  echo ""
  echo "Get it from Railway:"
  echo "1. Railway Dashboard → PostgreSQL service"
  echo "2. Variables tab → DATABASE_URL"
  echo "3. Copy the full URL"
  echo "4. Run: export DATABASE_URL='postgresql://...'"
  echo ""
  exit 1
fi

# Run migration
psql "$DATABASE_URL" <<EOF
ALTER TABLE event_settings 
ADD COLUMN IF NOT EXISTS event_title TEXT DEFAULT 'Event Mode Active',
ADD COLUMN IF NOT EXISTS event_banner_text TEXT DEFAULT 'Event Mode';

UPDATE event_settings 
SET event_title = COALESCE(event_title, 'Event Mode Active'),
    event_banner_text = COALESCE(event_banner_text, 'Event Mode')
WHERE id = 1;

SELECT id, event_title, event_banner_text FROM event_settings;
EOF

echo ""
echo "✅ Migration complete!"
echo ""
echo "Now you can set custom text in admin panel → Event Settings tab"

