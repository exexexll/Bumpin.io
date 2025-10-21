#!/bin/bash
# Run Location System Migration
# Gets DATABASE_URL from Railway and runs the migration

echo "🗺️  Running Location-Based Matchmaking Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set!"
  echo ""
  echo "Get it from Railway:"
  echo "1. Railway Dashboard → PostgreSQL service"
  echo "2. Variables tab → DATABASE_URL"
  echo "3. Copy the full URL"
  echo ""
  echo "Then run:"
  echo "  export DATABASE_URL='postgresql://...'"
  echo "  ./run-location-migration.sh"
  echo ""
  exit 1
fi

# Run migration
echo "Running SQL migration..."
psql "$DATABASE_URL" -f migrations/add-location-system.sql

echo ""
echo "✅ Location system migration complete!"
echo ""
echo "Features enabled:"
echo "  ✓ Location-based proximity sorting"
echo "  ✓ Distance display on user cards"
echo "  ✓ Privacy-protected (24-hour auto-expiry)"
echo ""
echo "Users will now see permission modal when opening matchmaking."

