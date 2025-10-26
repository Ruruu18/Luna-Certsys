# Vercel Deployment Guide - Resare Web Admin

## Quick Fix for 404 Error

The 404 error happens because Vercel doesn't know how to handle Vue Router's client-side routing. Follow these steps:

---

## Step 1: Configure Environment Variables in Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

### Required Environment Variables:

| Variable Name | Value | Where to get it |
|--------------|-------|----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Supabase Dashboard → Settings → API (⚠️ Keep secret!) |

**Important**:
- Add these for **Production**, **Preview**, and **Development** environments
- Click **Save** after adding each variable

---

## Step 2: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click the **...** (three dots) on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** ❌ (uncheck this)
5. Click **Redeploy**

OR push a new commit:

```bash
cd /Users/mharjadeenario/Desktop/Resare
git add .
git commit -m "Add Vercel configuration for Vue SPA routing"
git push
```

---

## Step 3: Verify Deployment

1. Wait for deployment to complete (2-3 minutes)
2. Visit your Vercel URL
3. You should see the login page instead of 404

---

## What the vercel.json Does

The `vercel.json` file we just created tells Vercel:

1. **Build Command**: `npm run build` - Builds your Vue app
2. **Output Directory**: `dist` - Where the built files are
3. **Rewrites**: All routes point to `index.html` - Fixes 404 on refresh
4. **Environment Variables**: References your Supabase keys

---

## Troubleshooting

### Still getting 404?

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Deployments
   - Click on the latest deployment
   - Check the **Build Logs** tab
   - Look for errors

2. **Check Environment Variables**:
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   # Make sure all 3 variables are set for "Production"
   ```

3. **Clear Build Cache**:
   - Redeploy with "Use existing Build Cache" **unchecked**

4. **Check vercel.json exists**:
   ```bash
   ls -la web/vercel.json
   # Should show the file exists
   ```

### Build Failing?

If the build fails with errors about environment variables:

1. Make sure `.env` file exists in `web/` folder locally
2. Make sure all environment variables are set in Vercel Dashboard
3. Check if `vite.config.ts` is configured correctly

### Routes not working after deployment?

This means the rewrites aren't working. Check:

1. `vercel.json` is in the `web/` directory (not root)
2. The `routes` section in `vercel.json` includes the catch-all route
3. Redeploy after making changes

---

## Project Structure for Vercel

Your Vercel project should be configured to deploy the `/web` subdirectory:

**Vercel Settings → General → Root Directory**: `web`

If this is not set:
1. Go to Settings → General
2. Edit **Root Directory**
3. Enter: `web`
4. Save and redeploy

---

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` file to Git
- Service role key should only be in Vercel Dashboard
- Anon key is safe to expose (it's public)
- Service role key has admin access - keep it secret!

---

## Testing After Deployment

1. **Login Page**: `https://your-app.vercel.app/`
2. **Admin Dashboard**: `https://your-app.vercel.app/dashboard`
3. **Users Page**: `https://your-app.vercel.app/users`

All routes should work without 404 errors.

---

## Common Issues

### "Missing environment variables" error

**Fix**: Add the variables in Vercel Dashboard and redeploy

### "Failed to fetch" or network errors

**Fix**: Check Supabase URL and keys are correct

### Admin features not working

**Fix**: Ensure `VITE_SUPABASE_SERVICE_ROLE_KEY` is set correctly

### 404 on page refresh

**Fix**: Ensure `vercel.json` has the rewrite rules (already added)

---

## Need Help?

1. Check Vercel deployment logs
2. Check browser console for errors (F12)
3. Verify environment variables are set
4. Ensure `vercel.json` is committed to Git

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Vercel URL**: _____________
**Status**: [ ] Success [ ] Issues Found
