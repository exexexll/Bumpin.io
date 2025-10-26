#!/bin/bash

# Dual-Storage Migration Script
# Run this to add active_rooms, referral_mappings, text_room_activity, and rate_limits tables

echo "🔄 Running Dual-Storage Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo "Please set it first:"
  echo "export DATABASE_URL='your_database_url_here'"
  exit 1
fi

# Show what we're about to do
echo "Migration will:"
echo "  ✓ Create active_rooms table (persist ongoing calls)"
echo "  ✓ Create referral_mappings table (persist intro links)"
echo "  ✓ Create text_room_activity table (persist torch rule state)"
echo "  ✓ Create rate_limits table (optional spam prevention)"
echo "  ✓ Add chat_mode column to chat_history"
echo "  ✓ Add session_data column to reports"
echo ""

# Run the migration
psql "$DATABASE_URL" -f migrations/add-active-rooms-and-referrals.sql

# Check if it succeeded
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "Next steps:"
  echo "  1. Restart your server (Railway auto-deploys on git push)"
  echo "  2. Check logs for: '[Recovery] Loaded X active rooms'"
  echo "  3. Active calls will now survive server restarts"
  echo ""
else
  echo ""
  echo "❌ Migration failed"
  echo "Check the error message above"
  echo ""
  exit 1
fi

