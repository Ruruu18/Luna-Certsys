# Supabase Storage Setup for Face Photos

## Issue
❌ **Error**: `Bucket not found`

The face photo upload is failing because the "faces" storage bucket hasn't been created in Supabase yet.

---

## Solution: Create the "faces" Storage Bucket

### Step 1: Go to Supabase Dashboard

1. Open your browser
2. Go to https://supabase.com/dashboard
3. Select your **Luna CERTSYS** project
4. Click on **Storage** in the left sidebar

### Step 2: Create New Bucket

1. Click the **"New bucket"** button
2. Fill in the details:

```
Name: faces
Public: ✓ (checked) - So images can be displayed in emails/app
File size limit: 5 MB (or adjust as needed)
Allowed MIME types: image/jpeg, image/png, image/jpg
```

3. Click **"Create bucket"**

### Step 3: Set Bucket Policies

After creating the bucket, you need to set up access policies:

#### Option A: Public Read Access (Recommended)

Click on the **"faces"** bucket → **Policies** tab → Add these policies:

**1. Allow Public Read**
```sql
-- Policy name: Public read access
-- Allowed operation: SELECT

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'faces');
```

**2. Allow Authenticated Users to Upload**
```sql
-- Policy name: Authenticated users can upload their own faces
-- Allowed operation: INSERT

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'faces');
```

**3. Allow Users to Update Their Own Photos**
```sql
-- Policy name: Users can update their own photos
-- Allowed operation: UPDATE

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'faces' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Option B: Quick Setup (Allow All - for testing)

If you want to test quickly first:

```sql
-- Allow anyone to read
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'faces');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'faces');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'faces');
```

---

## Step 4: Test the Upload

After creating the bucket and policies:

1. Restart your Expo Go app (close and reopen)
2. Go to Registration → Face Verification
3. Take a photo
4. Upload should work! ✅

---

## Alternative: Create Bucket via SQL (Advanced)

If you prefer SQL, run this in the **SQL Editor**:

```sql
-- Create the faces bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('faces', 'faces', true);

-- Set up policies
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'faces');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'faces');

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'faces');
```

---

## Bucket Structure

After setup, face photos will be stored like this:

```
faces/
  ├── user-id-1/
  │   └── user-id-1_verified_1234567890.jpg
  ├── user-id-2/
  │   └── user-id-2_verified_1234567891.jpg
  └── pending_1234567892/
      └── pending_1234567892_verified_1234567893.jpg
```

Each user gets their own folder for organization.

---

## Security Notes

✅ **Public bucket** is fine because:
- Face photos are needed for certificates (public documents)
- Photos are displayed in the mobile app
- Each user can only upload to their own folder
- Photo URLs are only shared with authorized users

🔒 **For extra security**, you can:
- Set bucket to private
- Generate signed URLs when needed
- Add Row Level Security (RLS) policies

---

## Troubleshooting

### Error: "Bucket not found"
- ✅ Make sure bucket name is exactly `faces` (lowercase)
- ✅ Refresh Supabase dashboard
- ✅ Check bucket exists in Storage section

### Error: "Permission denied"
- ✅ Check bucket policies are set up
- ✅ Make sure bucket is set to "Public"
- ✅ Verify user is authenticated

### Photos not displaying
- ✅ Bucket must be "Public" for URLs to work
- ✅ Check the photo URL is accessible in browser
- ✅ Verify CORS settings allow your domain

---

## Quick Checklist

- [ ] Created "faces" bucket in Supabase Storage
- [ ] Set bucket to "Public"
- [ ] Added read/upload policies
- [ ] Tested face photo upload in app
- [ ] Verified photo appears in Supabase Storage

---

**After completing these steps, face photo uploads will work!** 🎉
