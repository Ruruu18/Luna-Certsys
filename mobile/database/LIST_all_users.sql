-- List all users to see who we can make admin

SELECT
    id,
    email,
    full_name,
    role,
    created_at
FROM users
ORDER BY created_at DESC;
