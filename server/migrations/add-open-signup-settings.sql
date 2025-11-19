-- Add Open Signup Settings Table
-- Allows admin to toggle between invite-only and open signup

CREATE TABLE IF NOT EXISTS open_signup_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(255),
  
  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row (disabled by default - invite-only)
INSERT INTO open_signup_settings (id, enabled, updated_by)
VALUES (1, FALSE, 'system')
ON CONFLICT (id) DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_open_signup_enabled ON open_signup_settings(enabled);

COMMENT ON TABLE open_signup_settings IS 'Global setting for open signup vs invite-only mode';
COMMENT ON COLUMN open_signup_settings.enabled IS 'TRUE = open signup, FALSE = invite-only (default)';

