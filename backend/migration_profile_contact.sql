-- Migration Script: Add Doctor Contact Fields
-- Run this on your Postgres database

ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;

-- Migration complete
