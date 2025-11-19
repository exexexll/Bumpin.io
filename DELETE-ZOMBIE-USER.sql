-- Delete the zombie user that's blocking hlyan@usc.edu

-- Check what's there first:
SELECT user_id, name, email, pending_email, account_type, paid_status 
FROM users 
WHERE email = 'hlyan@usc.edu' OR pending_email = 'hlyan@usc.edu';

-- Delete the user (migration fixed foreign keys, so this should work now):
DELETE FROM users WHERE user_id = '691a7a97-0b46-4a4f-ae31-b20727dde43a';

-- Verify it's gone:
SELECT user_id, email FROM users WHERE email = 'hlyan@usc.edu' OR pending_email = 'hlyan@usc.edu';

-- Should return 0 rows
