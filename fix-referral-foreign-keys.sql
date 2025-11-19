-- Fix Referral Foreign Key Constraints to Allow User Deletion

-- ISSUE: Cannot delete users who have introduced others or were introduced
-- ERROR: violates foreign key constraint "users_introduced_to_fkey"
-- ERROR: violates foreign key constraint "users_introduced_by_fkey"

-- FIX: Change to ON DELETE SET NULL (referral info optional)

-- Step 1: Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_introduced_to_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_introduced_by_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referred_by_fkey;

-- Step 2: Add new constraints with SET NULL
ALTER TABLE users
ADD CONSTRAINT users_introduced_to_fkey 
FOREIGN KEY (introduced_to) 
REFERENCES users(user_id) 
ON DELETE SET NULL;

ALTER TABLE users
ADD CONSTRAINT users_introduced_by_fkey 
FOREIGN KEY (introduced_by) 
REFERENCES users(user_id) 
ON DELETE SET NULL;

ALTER TABLE users
ADD CONSTRAINT users_referred_by_fkey 
FOREIGN KEY (referred_by) 
REFERENCES users(user_id) 
ON DELETE SET NULL;

-- Now users can be deleted even if they introduced others
-- The referral info will just be set to NULL (graceful degradation)

-- Test:
-- DELETE FROM users WHERE user_id = 'some-user-id';
-- Should succeed even if user introduced others

