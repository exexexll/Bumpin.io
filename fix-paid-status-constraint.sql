-- Fix paid_status CHECK constraint to allow 'open_signup'

-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_paid_status_check;

-- Add new constraint including 'open_signup'
ALTER TABLE users 
ADD CONSTRAINT users_paid_status_check 
CHECK (paid_status IN ('unpaid', 'paid', 'qr_verified', 'qr_grace_period', 'open_signup'));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_paid_status_check';

