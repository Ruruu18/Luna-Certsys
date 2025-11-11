-- ============================================
-- Supabase Setup SQL for Resare Mobile App
-- ============================================

-- This file contains SQL functions and policies needed for the app to work properly

-- ============================================
-- 1. Function to get Purok Chairman (bypasses RLS)
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_purok_chairman(text, text);

-- Create function to get chairman by purok
CREATE OR REPLACE FUNCTION get_purok_chairman(
  purok_value TEXT,
  purok_number TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  suffix TEXT,
  full_name TEXT,
  role TEXT,
  purok TEXT,
  phone_number TEXT,
  address TEXT,
  date_of_birth DATE,
  place_of_birth TEXT,
  gender TEXT,
  civil_status TEXT,
  age INTEGER,
  nationality TEXT,
  photo_url TEXT,
  face_verified BOOLEAN,
  face_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  purok_chairman_id UUID,
  push_token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.middle_name,
    u.suffix,
    u.full_name,
    u.role,
    u.purok,
    u.phone_number,
    u.address,
    u.date_of_birth,
    u.place_of_birth,
    u.gender,
    u.civil_status,
    u.age,
    u.nationality,
    u.photo_url,
    u.face_verified,
    u.face_verified_at,
    u.created_at,
    u.updated_at,
    u.purok_chairman_id,
    u.push_token
  FROM users u
  WHERE u.role = 'purok_chairman'
    AND (
      LOWER(u.purok) = LOWER(purok_value)
      OR u.purok = purok_number
      OR LOWER(u.purok) = LOWER('Purok ' || purok_number)
    )
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_purok_chairman(TEXT, TEXT) TO authenticated;

-- ============================================
-- 2. Update RLS Policies (Alternative Approach)
-- ============================================

-- If you prefer not to use the RPC function, you can update the RLS policy
-- to allow users to view chairmen in their purok

-- Example RLS policy to allow users to view their purok chairman:
-- (Uncomment if you want to use this approach instead of the RPC function)

/*
CREATE POLICY "Users can view their purok chairman"
ON users
FOR SELECT
TO authenticated
USING (
  role = 'purok_chairman'
  AND (
    purok IN (
      SELECT u.purok FROM users u WHERE u.id = auth.uid()
    )
  )
);
*/

-- ============================================
-- 3. Verify the setup
-- ============================================

-- Test the function (replace 'Purok 1' with your actual purok value)
-- SELECT * FROM get_purok_chairman('Purok 1', '1');

-- ============================================
-- INSTRUCTIONS
-- ============================================

/*
1. Open your Supabase dashboard: https://app.supabase.com
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Copy and paste this entire file
5. Click "Run" to execute

This will:
- Create a function that allows residents to view their purok chairman
- Grant necessary permissions
- Bypass RLS policies for this specific use case

The function is marked as SECURITY DEFINER, which means it runs with
the permissions of the user who created it (you), bypassing RLS.
*/
