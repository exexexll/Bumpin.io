-- ⚠️ RUN THIS IN RAILWAY POSTGRESQL NOW! ⚠️
-- This adds the custom text columns for event mode

-- Add event_title column (for event-wait page header)
ALTER TABLE event_settings 
ADD COLUMN IF NOT EXISTS event_title TEXT DEFAULT 'Event Mode Active';

-- Add event_banner_text column (for notification banner)
ALTER TABLE event_settings 
ADD COLUMN IF NOT EXISTS event_banner_text TEXT DEFAULT 'Event Mode';

-- Update existing row to have default values
UPDATE event_settings 
SET 
  event_title = COALESCE(event_title, 'Event Mode Active'),
  event_banner_text = COALESCE(event_banner_text, 'Event Mode')
WHERE id = 1;

-- Verify it worked
SELECT id, event_mode_enabled, event_title, event_banner_text FROM event_settings;

-- You should see:
-- id | event_mode_enabled | event_title         | event_banner_text
-- ---|--------------------|--------------------|------------------
-- 1  | true               | Event Mode Active  | Event Mode

