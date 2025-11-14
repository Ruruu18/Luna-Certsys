# Deployment Guide - Fixes for Real-Time Updates & User Creation

## Issues Fixed

1. **Web App**: Real-time updates not working (had to refresh for delete/update)
2. **Mobile App**: Residents couldn't log in with temporary password
3. **Mobile App**: Improper SQL functions trying to directly insert into auth.users

---

## Deployment Steps

### Step 1: Deploy Edge Functions to Supabase

Edge Functions are needed to create users with auto-confirmed emails.

#### 1.1 Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

#### 1.2 Login to Supabase
```bash
supabase login
```

#### 1.3 Link to your Supabase project
```bash
cd /Users/mharjadeenario/Desktop/Resare
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
- Go to Supabase Dashboard → Settings → General
- Copy the "Reference ID"

#### 1.4 Deploy the Edge Functions
```bash
supabase functions deploy create-confirmed-user
supabase functions deploy approve-resident-registration
```

---

### Step 2: Enable Realtime in Supabase Dashboard

**For the Web App to have real-time updates:**

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find and **enable Realtime** for these tables:
   - ✅ `users`
   - ✅ `certificate_requests`
   - ✅ `certificates`
   - ✅ `pending_registrations` (for mobile notifications)

---

### Step 3: Clear Invalid Web Sessions

Users who have invalid refresh tokens need to clear their session:

1. Open browser console (F12)
2. Run:
```javascript
localStorage.removeItem('resare-web-auth')
location.reload()
```
3. Log in again

**OR** - The auto-clearing code I added will handle this automatically on next page load.

---

### Step 4: Restart Development Servers

#### Web App:
```bash
cd web
npm run dev
```

#### Mobile App:
```bash
cd mobile
npm start
```

Then press `i` for iOS or `a` for Android.

---

## What Was Changed

### Web App (`/web`)

**File: `web/src/lib/supabase.ts`**
- ✅ Added realtime configuration to Supabase client
- ✅ Added auto-detection and clearing of invalid sessions
- ✅ Added auth event logging for debugging

### Mobile App (`/mobile`)

**File: `mobile/src/lib/supabase.ts`**
- ✅ Exported `SUPABASE_URL` for Edge Function calls

**File: `mobile/src/screens/ManageResidentsScreen.tsx`**
- ✅ Changed from `supabase.auth.signUp()` to Edge Function call
- ✅ Users now created with auto-confirmed emails
- ✅ Can log in immediately with temporary password

**File: `mobile/src/screens/PendingRegistrationsScreen.tsx`**
- ✅ Changed from RPC to Edge Function call
- ✅ Approvals now create confirmed user accounts

### Supabase Functions (`/supabase/functions`)

**New File: `create-confirmed-user/index.ts`**
- Creates resident users with auto-confirmed emails
- Used by Manage Residents screen

**New File: `approve-resident-registration/index.ts`**
- Approves pending registrations and creates confirmed accounts
- Used by Pending Registrations approval flow

### Removed/Deprecated

**Files deleted (improper SQL approach):**
- ❌ `mobile/database/create_confirmed_user_function.sql`
- ❌ `mobile/database/approve_resident_registration_function.sql`

These were trying to directly insert into `auth.users` which is not allowed.

---

## Testing

### Test 1: Real-Time Updates (Web)

1. Open web app in **two browser tabs**
2. Log in as admin
3. In Tab 1: Go to Users page
4. In Tab 2: Delete or update a user
5. **Expected**: Tab 1 updates automatically without refresh

### Test 2: Resident Login (Mobile)

1. As **Purok Chairman**, add a new resident
2. Copy the **temporary password** shown
3. Log out
4. Log in as the new resident using:
   - Email: [resident email]
   - Password: [temporary password]
5. **Expected**: Login succeeds immediately

### Test 3: Approve Registration (Mobile)

1. Have a resident submit a registration
2. As **Purok Chairman**, approve the registration
3. Copy the **temporary password**
4. Log out
5. Log in as the approved resident
6. **Expected**: Login succeeds immediately

### Test 4: Notification Badges (Mobile)

1. Submit a new registration as a resident
2. Check the Chairman's dashboard
3. **Expected**: "Pending Registrations" shows a badge count

---

## Troubleshooting

### Edge Functions not working?

**Error**: `404 Not Found` when calling Edge Function

**Solution**:
1. Verify functions are deployed:
   ```bash
   supabase functions list
   ```
2. Check function logs:
   ```bash
   supabase functions logs create-confirmed-user
   supabase functions logs approve-resident-registration
   ```

### Real-time not updating?

**Error**: Changes don't appear without refresh

**Solution**:
1. Verify Realtime is enabled in Supabase Dashboard
2. Check browser console for subscription errors
3. Ensure RLS policies allow SELECT on tables

### Residents still can't log in?

**Error**: "Invalid login credentials"

**Solution**:
1. Verify Edge Functions are deployed
2. Check Supabase logs for errors
3. Ensure temporary password is copied exactly
4. Try resetting the password in Supabase Dashboard

---

## Environment Variables

Ensure these are set:

### Web (`.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Mobile (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Support

If issues persist:
1. Check Supabase logs: Dashboard → Logs
2. Check Edge Function logs: `supabase functions logs [function-name]`
3. Check browser/app console for errors
