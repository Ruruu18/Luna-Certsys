-- Fix RLS policies to allow service role to update users
-- Run this in Supabase SQL Editor

-- First, check if policy exists and drop it
DROP POLICY IF EXISTS "Service role bypass RLS" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "service_role_all_access" ON public.users;

-- Create comprehensive service role policy for ALL operations
CREATE POLICY "service_role_all_access"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can view chairmen (for the chairman selector)
DROP POLICY IF EXISTS "allow_viewing_chairmen" ON public.users;

CREATE POLICY "allow_viewing_chairmen"
ON public.users
FOR SELECT
TO authenticated
USING (role = 'purok_chairman' OR role = 'admin');

-- Allow authenticated users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
