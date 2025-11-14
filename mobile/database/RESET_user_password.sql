-- Reset a user's password using Supabase Auth admin functions
-- Replace 'user@example.com' with actual email
-- Replace 'new_password_here' with the new password

-- This requires running from Supabase SQL Editor as it uses auth admin functions

-- Note: You cannot run admin.updateUserById from SQL
-- You must use the Supabase Dashboard or API

-- Instead, just delete the broken user and recreate:
-- 1. Delete from auth.users
DELETE FROM auth.users WHERE email = 'user@example.com';

-- 2. Delete from public.users
DELETE FROM public.users WHERE email = 'user@example.com';

-- 3. Delete from pending_registrations
DELETE FROM pending_registrations WHERE email = 'user@example.com';

-- 4. Have the user register again
-- 5. Chairman approves using the mobile app (which uses service role key now)
