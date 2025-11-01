-- Remove Duplicate USC Card Registrations
-- Keeps the FIRST registration for each USC ID, deletes duplicates
-- Run this migration to clean up duplicate cards

BEGIN;

-- Find and delete duplicate USC card registrations
-- Keep only the first (oldest) registration for each usc_id
DELETE FROM usc_card_registrations
WHERE id NOT IN (
  SELECT MIN(id)
  FROM usc_card_registrations
  GROUP BY usc_id
);

-- Log how many were removed
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Removed % duplicate USC card registrations', deleted_count;
END $$;

COMMIT;

-- Verify: Check for any remaining duplicates
SELECT usc_id, COUNT(*) as registration_count
FROM usc_card_registrations
GROUP BY usc_id
HAVING COUNT(*) > 1;

-- Should return 0 rows if successful

