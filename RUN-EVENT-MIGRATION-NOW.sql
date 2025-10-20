-- Event Custom Text Migration
-- Run this in Railway PostgreSQL NOW

ALTER TABLE event_settings 
ADD COLUMN IF NOT EXISTS event_title TEXT DEFAULT 'Event Mode Active',
ADD COLUMN IF NOT EXISTS event_banner_text TEXT DEFAULT 'Event Mode';

UPDATE event_settings 
SET event_title = COALESCE(event_title, 'Event Mode Active'),
    event_banner_text = COALESCE(event_banner_text, 'Event Mode')
WHERE id = 1;

-- Verify it worked:
SELECT id, event_mode_enabled, event_title, event_banner_text FROM event_settings;

-- Expected output:
-- id | event_mode_enabled | event_title         | event_banner_text
-- ---|--------------------|--------------------|------------------
-- 1  | true/false         | Event Mode Active  | Event Mode

