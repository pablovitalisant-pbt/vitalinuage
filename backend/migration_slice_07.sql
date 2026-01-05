-- Migration Script: Add Email Verification Columns
-- Run this on your Neon Production Database

ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR;
ALTER TABLE users ADD COLUMN verification_token_expires_at TIMESTAMP;

-- Migration complete
