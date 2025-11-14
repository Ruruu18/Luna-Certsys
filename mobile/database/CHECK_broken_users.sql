-- Check for users that might have broken passwords
-- Users created in the last 24 hours

SELECT
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    pu.email as profile_email,
    pu.first_name,
    pu.last_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.created_at > NOW() - INTERVAL '48 hours'
ORDER BY au.created_at DESC;
