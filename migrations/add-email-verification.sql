-- Email verification system
-- Run this in Railway PostgreSQL

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verification_code_expires_at BIGINT,
ADD COLUMN IF NOT EXISTS verification_attempts INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, email_verified);

