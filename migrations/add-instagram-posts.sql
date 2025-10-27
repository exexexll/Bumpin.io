-- Add Instagram Posts to Users
-- Allows users to showcase their Instagram content in matchmaking

-- Add instagram_posts column (array of post URLs)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS instagram_posts TEXT[] DEFAULT '{}';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_instagram_posts ON users 
USING GIN (instagram_posts) 
WHERE instagram_posts IS NOT NULL AND array_length(instagram_posts, 1) > 0;

-- Verify the change
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'instagram_posts';

-- Example usage:
-- UPDATE users SET instagram_posts = ARRAY['https://www.instagram.com/p/ABC123/', 'https://www.instagram.com/p/DEF456/'] WHERE user_id = 'xxx';

SELECT 'Instagram posts column added successfully' AS status;

