# Logo Hosting Setup for Luna CERTSYS

## Using Vercel for Email Images (Recommended)

Since email templates need publicly accessible URLs, we'll host the logo images on Vercel with your web app.

### Step 1: Copy Images to Web Project

```bash
# From the Resare root directory
cp mobile/assets/Luna-Icon.png web/public/images/
cp mobile/assets/images/logo.png web/public/images/luna-certsys-logo.png
```

Or manually:
1. Open `/mobile/assets/Luna-Icon.png`
2. Copy to `/web/public/images/Luna-Icon.png`
3. Open `/mobile/assets/images/logo.png`
4. Copy to `/web/public/images/luna-certsys-logo.png`

### Step 2: Deploy to Vercel

After copying the images:

```bash
cd web
git add public/images/
git commit -m "Add Luna CERTSYS logo images for email templates"
git push
```

Vercel will automatically deploy the changes.

### Step 3: Get the Public URLs

After Vercel deployment completes, your images will be available at:

```
https://your-vercel-domain.vercel.app/images/Luna-Icon.png
https://your-vercel-domain.vercel.app/images/luna-certsys-logo.png
```

Replace `your-vercel-domain` with your actual Vercel domain.

### Step 4: Update Email Assets

Edit `/mobile/src/services/emailAssets.ts`:

```typescript
export const EMAIL_ASSETS = {
  // Barangay Luna Surigao City Official Seal
  BARANGAY_SEAL_URL: 'https://your-vercel-domain.vercel.app/images/Luna-Icon.png',

  // Luna CERTSYS System Logo
  LUNA_LOGO_URL: 'https://your-vercel-domain.vercel.app/images/luna-certsys-logo.png',
};
```

### Step 5: Test the Email

1. Open mobile app (Expo Go)
2. Go to Dashboard → Test Email
3. Send a test email
4. Check your inbox - logos should display correctly!

---

## Using Expo Assets for Mobile App (Already Working)

For the mobile app itself (not emails), the images are already in the correct location:

- ✅ `/mobile/assets/Luna-Icon.png` - Already accessible via `require()`
- ✅ `/mobile/assets/images/logo.png` - Already accessible via `require()`

These work fine in the Expo Go app and will be bundled with your APK/IPA when you build.

---

## Summary

| Use Case | Solution | Status |
|----------|----------|--------|
| **Mobile App UI** | Use local assets in `/mobile/assets/` | ✅ Already working |
| **Email Templates** | Host on Vercel at `/web/public/images/` | ⏳ Need to copy & deploy |
| **APK Build** | Assets bundled automatically by Expo | ✅ Will work automatically |

---

## Quick Commands

```bash
# Navigate to your project root
cd /Users/mharjadeenario/Desktop/Resare

# Create images directory in web public folder (if it doesn't exist)
mkdir -p web/public/images

# Copy the logos
cp mobile/assets/Luna-Icon.png web/public/images/
cp mobile/assets/images/logo.png web/public/images/luna-certsys-logo.png

# Commit and deploy
cd web
git add public/images/
git commit -m "Add Luna CERTSYS logos for email templates"
git push

# After Vercel deploys, update the URLs in:
# /mobile/src/services/emailAssets.ts
```

---

## Notes

- **Vercel hosting is free** for static assets like images
- **Images are cached** by Vercel CDN for fast loading
- **Once deployed**, the URLs are permanent and public
- **For Expo Go**: No changes needed, assets already work
- **For production APK**: Images will be bundled automatically

---

## Testing

After deployment:

1. **Test Image URLs** (in browser):
   - Visit `https://your-domain.vercel.app/images/Luna-Icon.png`
   - Visit `https://your-domain.vercel.app/images/luna-certsys-logo.png`
   - Both should display correctly

2. **Test Email Template**:
   - Open mobile app → Dashboard → Test Email
   - Send test email to yourself
   - Check inbox - logos should appear in email header

---

**Need Help?**

If images don't appear:
- Check Vercel deployment logs
- Verify image URLs are accessible in browser
- Check `/web/public/images/` folder exists
- Ensure correct URLs in `emailAssets.ts`
