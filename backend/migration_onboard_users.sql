-- Migration script for Onboarding features
-- Execute this manually against the Postgres DB if auto-creation fails

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_license VARCHAR;
