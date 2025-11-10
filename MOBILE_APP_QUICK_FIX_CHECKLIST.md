# Resare Mobile App - Quick Fix Checklist

## Critical Issues to Fix (DO FIRST)

### 1. Missing notification-icon.png Asset
- [ ] Create or obtain notification-icon.png (192x192px minimum)
- [ ] Place in `/mobile/assets/notification-icon.png`
- [ ] Verify app.json references this file (Line 44)

### 2. Create Supabase Storage Bucket
- [ ] Login to Supabase Dashboard
- [ ] Go to Storage section
- [ ] Create new bucket named: `faces`
- [ ] Set to Private
- [ ] Enable RLS

### 3. Apply Database Migrations
- [ ] Go to Supabase SQL Editor
- [ ] Copy & paste content of `/database-migrations/001_additional_tables.sql`
- [ ] Run query
- [ ] Copy & paste content of `/database-migrations/002_add_certificate_pdf_support.sql`
- [ ] Run query
- [ ] Copy & paste content of `/database-migrations/003_separate_name_fields_face_verification.sql`
- [ ] Run query

### 4. Configure Email Assets
- [ ] Upload `Luna-Icon.png` to CDN (ImgBB, Imgur, or similar)
- [ ] Upload `logo.png` to CDN
- [ ] Copy download URLs
- [ ] Edit `/mobile/src/services/emailAssets.ts`
- [ ] Replace placeholder URLs with actual CDN URLs:
  ```typescript
  BARANGAY_SEAL_URL: 'https://[your-cdn]/Luna-Icon.png',
  LUNA_LOGO_URL: 'https://[your-cdn]/logo.png',
  ```

### 5. Verify Resend Email Configuration
- [ ] Go to https://resend.com
- [ ] Sign in with your account
- [ ] Add and verify sender email: `enariomharjade@gmail.com`
- [ ] Or change hardcoded email in `/mobile/src/services/emailService.ts` Line 46

---

## Secondary Issues to Fix (BEFORE RELEASE)

### 6. Implement Photo Quality Validation
- [ ] Edit `/mobile/src/services/faceVerification.ts`
- [ ] Replace TODO function `validatePhotoQuality()` (Line 192-197)
- [ ] Add:
  - File size check (min: 50KB, max: 5MB)
  - Image dimension check (min: 640x480)
  - Optional: Face detection using expo-face-detector

### 7. Add Storage Bucket RLS Policies
In Supabase Storage > Policies for 'faces' bucket:

**SELECT Policy:**
```sql
auth.uid() = (path_tokens[1])::uuid OR 
(SELECT role FROM users WHERE id = auth.uid()) = 'admin'
```

**INSERT Policy:**
```sql
auth.uid() = (path_tokens[1])::uuid
```

**UPDATE Policy:**
```sql
false
```

**DELETE Policy:**
```sql
(SELECT role FROM users WHERE id = auth.uid()) = 'admin'
```

### 8. Add Missing Database Columns
If migration 002 wasn't applied, manually add to `certificate_requests` table:
```sql
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS certificate_number TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE;
```

---

## Testing Checklist (BEFORE RELEASE)

### Registration Flow
- [ ] Register new user
- [ ] Face verification works
- [ ] Face photo uploads to storage
- [ ] Approval email sends with logos
- [ ] User receives password email
- [ ] Login with credentials works

### Certificate Request Flow
- [ ] Request certificate
- [ ] Payment creates PayMongo intent
- [ ] Payment screen displays correctly
- [ ] Completion updates database
- [ ] Certificate generates and downloads

### Notifications
- [ ] Push notification permission requests
- [ ] Notification icon displays correctly
- [ ] Certificate status updates notify user
- [ ] Payment notifications work

### Payment (Important!)
- [ ] Test with PayMongo test keys
- [ ] Payment intent creates successfully
- [ ] Payment method selection works
- [ ] Redirect after payment works
- [ ] Database updated with payment info

---

## Estimated Time to Fix

| Task | Time | Priority |
|------|------|----------|
| Create notification icon | 15 min | Critical |
| Create Supabase bucket | 10 min | Critical |
| Apply migrations | 15 min | Critical |
| Upload email images | 20 min | Critical |
| Verify email sender | 10 min | Critical |
| Implement photo validation | 30 min | High |
| Add RLS policies | 15 min | High |
| Complete testing | 60 min | High |
| **TOTAL** | **~175 min** (3 hours) | - |

---

## Quick Validation Commands

### Check if migrations were applied:
```sql
-- In Supabase SQL Editor
SELECT column_name FROM information_schema.columns 
WHERE table_name='users' AND column_name='first_name';
```

### Check storage bucket:
```sql
-- Go to Storage section, verify 'faces' bucket exists
```

### Test Resend email:
1. Go to Dashboard > Email Test
2. Click "Send Test Email"
3. Check inbox for email with logos

### Test face upload:
1. Go through registration
2. Capture face photo
3. Check in Supabase Storage > faces bucket

---

## Common Issues & Solutions

### Issue: "Failed to upload face photo"
- Check: Is 'faces' bucket created?
- Check: Is RLS policy correct?
- Check: Does policy allow user uploads?

### Issue: "Email images not displaying"
- Check: Are URLs accessible?
- Check: Are URLs in emailAssets.ts updated?
- Check: Is Resend API key valid?

### Issue: "Migration fails with syntax error"
- Solution: Copy the entire SQL file content
- Run in Supabase SQL Editor
- Check for special characters or encoding issues

### Issue: "App crashes on face capture"
- Check: Is expo-file-system installed?
- Check: Camera permissions granted?
- Check: Device has enough storage?

### Issue: "Payment fails"
- Check: Are PayMongo keys correct in .env?
- Check: Are you using test keys for testing?
- Check: Is network working properly?

---

## Files to Edit Summary

| File | Change | Status |
|------|--------|--------|
| `/mobile/assets/notification-icon.png` | ADD FILE | Critical |
| `/mobile/src/services/emailAssets.ts` | Update URLs | Critical |
| `/mobile/src/services/emailService.ts` | Verify sender email | Critical |
| `/mobile/src/services/faceVerification.ts` | Implement validation | High |
| Supabase Dashboard | Create bucket | Critical |
| Supabase SQL Editor | Run migrations | Critical |
| Resend Dashboard | Verify email | Critical |

---

## Progress Tracking

Track your progress:
- [ ] All Critical items fixed
- [ ] All High priority items fixed
- [ ] All tests passing
- [ ] Ready for beta testing
- [ ] Ready for production

**Notes:**
Remember to test on actual devices, not just emulators, especially for:
- Push notifications
- Face camera capture
- Payment gateway
- Storage uploads
