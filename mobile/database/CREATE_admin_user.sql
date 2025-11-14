-- Create an admin user account
-- Change the email and password below

-- Step 1: Create auth user
-- YOU CANNOT DO THIS IN SQL - Use Supabase Dashboard instead:
-- 1. Go to Supabase Dashboard → Authentication → Add User
-- 2. Email: admin@resare.com (or your email)
-- 3. Password: (set a password)
-- 4. Auto-confirm email: YES
-- 5. Copy the user ID after creation

-- Step 2: After creating in dashboard, run this SQL with the user ID:
-- Replace 'USER_ID_FROM_DASHBOARD' with the actual ID

INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    full_name,
    role,
    face_verified
) VALUES (
    'USER_ID_FROM_DASHBOARD'::uuid, -- Replace with actual user ID
    'admin@resare.com', -- Replace with actual email
    'Admin',
    'User',
    'Admin User',
    'admin',
    true
);

-- Or if you already have a user that you want to make admin:
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
