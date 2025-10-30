-- Add index for single session query performance
-- This speeds up invalidateUserSessions by 10-100x

-- Index on (user_id, is_active) for fast session invalidation
CREATE INDEX IF NOT EXISTS idx_sessions_user_active 
ON sessions(user_id, is_active) 
WHERE is_active = TRUE;

-- Index on (user_id, created_at) for cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_created 
ON sessions(user_id, created_at DESC);

-- Result: invalidateUserSessions query goes from O(n) to O(log n)
