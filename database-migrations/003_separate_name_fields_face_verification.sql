-- Migration: Separate Name Fields and Face Verification
-- Purpose: Split full_name into first_name/last_name and add face verification system
-- Date: 2025-10-26
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Add new name fields
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- middle_name and suffix already exist from migration 002

-- ============================================
-- STEP 2: Add face verification fields
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_verified_at TIMESTAMP WITH TIME ZONE;

-- photo_url already exists from migration 002

-- ============================================
-- STEP 3: Migrate existing full_name data
-- ============================================

-- Parse full_name into first_name and last_name
-- Handles cases like:
-- "Juan Dela Cruz" -> first: "Juan", last: "Dela Cruz"
-- "Maria" -> first: "Maria", last: ""
-- "John Paul Santos" -> first: "John", last: "Paul Santos"

UPDATE users
SET
  first_name = CASE
    WHEN full_name IS NOT NULL AND full_name != ''
    THEN TRIM(SPLIT_PART(full_name, ' ', 1))
    ELSE 'Unknown'
  END,
  last_name = CASE
    WHEN full_name IS NOT NULL AND full_name != ''
    THEN TRIM(SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2))
    ELSE 'User'
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Handle edge cases where last_name might be empty
UPDATE users
SET last_name = first_name
WHERE last_name IS NULL OR last_name = '';

-- ============================================
-- STEP 4: Make first_name and last_name required
-- ============================================

ALTER TABLE users
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- ============================================
-- STEP 5: Create computed full_name view for backward compatibility
-- ============================================

-- Option A: Keep full_name column but make it computed (not recommended for large tables)
-- We'll keep it for now and update it via trigger

CREATE OR REPLACE FUNCTION update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically compute full_name from first_name, middle_name, last_name, suffix
  NEW.full_name := TRIM(
    CONCAT_WS(' ',
      NEW.first_name,
      CASE WHEN NEW.middle_name IS NOT NULL AND NEW.middle_name != ''
           THEN NEW.middle_name
           ELSE NULL END,
      NEW.last_name,
      CASE WHEN NEW.suffix IS NOT NULL AND NEW.suffix != ''
           THEN NEW.suffix
           ELSE NULL END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_full_name
  BEFORE INSERT OR UPDATE OF first_name, middle_name, last_name, suffix ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_full_name();

-- Update existing full_name values
UPDATE users
SET full_name = TRIM(
  CONCAT_WS(' ',
    first_name,
    CASE WHEN middle_name IS NOT NULL AND middle_name != '' THEN middle_name ELSE NULL END,
    last_name,
    CASE WHEN suffix IS NOT NULL AND suffix != '' THEN suffix ELSE NULL END
  )
);

-- ============================================
-- STEP 6: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_face_verified ON users(face_verified);
CREATE INDEX IF NOT EXISTS idx_users_face_verified_at ON users(face_verified_at);

-- ============================================
-- STEP 7: Add comments for documentation
-- ============================================

COMMENT ON COLUMN users.first_name IS 'User''s first name (required)';
COMMENT ON COLUMN users.last_name IS 'User''s last name (required)';
COMMENT ON COLUMN users.middle_name IS 'User''s middle name (optional)';
COMMENT ON COLUMN users.suffix IS 'Name suffix like Jr., Sr., III (optional)';
COMMENT ON COLUMN users.full_name IS 'Computed full name (auto-generated from first_name + middle_name + last_name + suffix)';
COMMENT ON COLUMN users.face_verified IS 'Whether user has completed face verification';
COMMENT ON COLUMN users.face_verified_at IS 'Timestamp when face verification was completed';
COMMENT ON COLUMN users.photo_url IS 'URL to verified face photo in Supabase Storage (captured during registration)';

-- ============================================
-- STEP 8: Create Storage Bucket for Face Photos
-- ============================================

-- Note: This needs to be done via Supabase Dashboard or Storage API
-- Bucket name: 'faces'
-- Settings: Private, RLS enabled
-- Manual step: Create bucket in Supabase Dashboard > Storage

-- ============================================
-- STEP 9: Add RLS policies for face photos
-- ============================================

-- Users can only view their own face photo
-- Admins can view all face photos

-- This will be applied to the storage bucket via Supabase Dashboard
-- Or using SQL if storage policies are supported:

-- Example policy (apply in Storage settings):
-- SELECT: auth.uid() = user_id OR is_admin()
-- INSERT: auth.uid() = user_id
-- UPDATE: false (face photos are immutable once verified)
-- DELETE: is_admin() only

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check migration results
SELECT
  id,
  first_name,
  middle_name,
  last_name,
  suffix,
  full_name,
  face_verified,
  email
FROM users
LIMIT 5;

-- Count users by verification status
SELECT
  face_verified,
  COUNT(*) as user_count
FROM users
GROUP BY face_verified;

-- ============================================
-- ROLLBACK (if needed - run with caution!)
-- ============================================

-- Uncomment to rollback this migration:

-- DROP TRIGGER IF EXISTS trigger_update_full_name ON users;
-- DROP FUNCTION IF EXISTS update_full_name();
-- ALTER TABLE users DROP COLUMN IF EXISTS first_name;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_name;
-- ALTER TABLE users DROP COLUMN IF EXISTS face_verified;
-- ALTER TABLE users DROP COLUMN IF EXISTS face_verified_at;
-- DROP INDEX IF EXISTS idx_users_first_name;
-- DROP INDEX IF EXISTS idx_users_last_name;
-- DROP INDEX IF EXISTS idx_users_face_verified;
-- DROP INDEX IF EXISTS idx_users_face_verified_at;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Next steps:
-- 1. Create 'faces' storage bucket in Supabase Dashboard
-- 2. Update application code to use first_name and last_name
-- 3. Implement face verification flow in mobile app
-- 4. Test registration with face capture
