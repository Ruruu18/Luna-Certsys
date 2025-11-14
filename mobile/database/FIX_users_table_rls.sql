-- Check current RLS policies on users table
SELECT
    tablename,
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Drop if exists, then create policy to allow chairman to SELECT admin users
DROP POLICY IF EXISTS "chairman_can_view_admins" ON users;

CREATE POLICY "chairman_can_view_admins"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'admin'
    OR
    id = auth.uid()
    OR
    purok_chairman_id = auth.uid()
  );

-- Verify
SELECT 'Policy created' as status;
