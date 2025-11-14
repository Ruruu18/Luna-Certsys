-- Fix existing users who have photos but are marked as not verified

UPDATE users
SET
    face_verified = true,
    face_verified_at = COALESCE(face_verified_at, created_at)
WHERE photo_url IS NOT NULL
  AND photo_url != ''
  AND face_verified = false;

-- Check how many were fixed
SELECT
    COUNT(*) as users_fixed,
    'Users with photos now marked as verified' as description
FROM users
WHERE photo_url IS NOT NULL
  AND photo_url != ''
  AND face_verified = true;
