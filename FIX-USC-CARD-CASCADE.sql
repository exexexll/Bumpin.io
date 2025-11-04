-- Fix USC Card Registration CASCADE Delete

-- First, check if table exists and what constraints it has
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'usc_card_registrations'::regclass;

-- If user_id column doesn't have ON DELETE CASCADE, fix it:

-- Step 1: Drop existing foreign key if it doesn't have CASCADE
ALTER TABLE usc_card_registrations 
DROP CONSTRAINT IF EXISTS usc_card_registrations_user_id_fkey;

-- Step 2: Add foreign key with ON DELETE CASCADE
ALTER TABLE usc_card_registrations
ADD CONSTRAINT usc_card_registrations_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(user_id) 
ON DELETE CASCADE;

-- This ensures when a user is deleted, their USC card registration is also deleted
-- and the card becomes available for re-registration

-- Test: Delete a user and verify USC card is freed
-- SELECT * FROM usc_card_registrations WHERE user_id = 'test-user-id';
-- DELETE FROM users WHERE user_id = 'test-user-id';
-- SELECT * FROM usc_card_registrations WHERE user_id = 'test-user-id'; -- Should return 0 rows
