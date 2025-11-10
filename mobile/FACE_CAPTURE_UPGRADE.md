# Face Capture Upgrade Guide

## Current Implementation: SimpleFaceCapture
Currently using a basic camera that works in Expo Go without native modules.

**Features:**
- ✅ Camera with face guide circle
- ✅ Manual tap to capture
- ✅ Auto-crops to square (512px)
- ✅ Preview & confirm/retake
- ✅ Works immediately in Expo Go

---

## Future Upgrade: FaceCaptureCamera (Advanced ML Version)

### Features You'll Get:
- ✅ **ML-powered real-time face detection** - Live face tracking with bounding box
- ✅ **Auto-capture on blink** - User just blinks to take photo (no button press!)
- ✅ **Face-only cropping** - Removes all background/body, keeps only face with padding
- ✅ **Quality validation** - Automatic checks for face size, angle, lighting
- ✅ **Green/Orange/Red feedback** - Visual indicators for face position quality
- ✅ **Multiple safety checks**:
  - Single face only (rejects multiple faces)
  - Face size check (not too close/far)
  - Face angle check (must face camera directly)
  - Eye detection for blink

### Why Not Active Now?
- Requires `expo-face-detector` which uses native modules
- Native modules don't work in Expo Go
- Needs development build to work

---

## How to Upgrade (When Ready)

### Step 1: Update the Import
**File:** `/mobile/src/screens/RegistrationScreen.tsx`

**Change line 25 from:**
```typescript
import SimpleFaceCapture from '../components/SimpleFaceCapture';
```

**To:**
```typescript
import FaceCaptureCamera from '../components/FaceCaptureCamera';
```

### Step 2: Update the Component Usage
**Change around line 1025 from:**
```typescript
<SimpleFaceCapture
  onCapture={(photoUri) => {
```

**To:**
```typescript
<FaceCaptureCamera
  onCapture={(photoUri) => {
```

### Step 3: Create Development Build

**Run these commands in terminal:**
```bash
cd /Users/mharjadeenario/Desktop/Resare/mobile

# Clean and create native project files
npx expo prebuild --clean

# Build and run for iOS
npx expo run:ios

# OR for Android
npx expo run:android
```

**Note:** First build takes 10-15 minutes. Be patient!

### Step 4: Test the New Features

1. Go to Registration screen
2. Click "Capture Face Photo"
3. Position your face in the frame
4. Watch for green oval around your face
5. Read instruction: "Blink to capture!"
6. **Just blink once** - photo captures automatically!
7. Review the cropped face-only photo
8. Confirm or retake

---

## Technical Details

### Libraries Used:
- `expo-camera` - Camera access and capture
- `expo-face-detector` - Google ML Kit for face detection
- `expo-image-manipulator` - Image cropping and optimization

### Face Detection Settings:
```typescript
{
  mode: FaceDetector.FaceDetectorMode.fast,
  detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
  runClassifications: FaceDetector.FaceDetectorClassifications.all,
  minDetectionInterval: 100,
  tracking: true
}
```

### Blink Detection Logic:
```typescript
// Eyes closed when both eye open probability < 0.3
const eyesClosed = leftEyeOpen < 0.3 && rightEyeOpen < 0.3;

// Eyes open when both eye open probability > 0.7
const eyesOpen = leftEyeOpen > 0.7 && rightEyeOpen > 0.7;

// Blink detected when eyes close then open
if (eyesClosed) {
  wasEyesClosed = true;
} else if (eyesOpen && wasEyesClosed) {
  // CAPTURE!
}
```

### Face Cropping:
```typescript
// Get face bounds from ML detector
const face = detectedFaces[0];
const x = face.bounds.origin.x;
const y = face.bounds.origin.y;
const width = face.bounds.size.width;
const height = face.bounds.size.height;

// Add 30% padding around face
const padding = 0.3;

// Crop and resize to 512px
```

---

## Comparison

| Feature | SimpleFaceCapture (Current) | FaceCaptureCamera (Upgrade) |
|---------|----------------------------|----------------------------|
| **Works in Expo Go** | ✅ Yes | ❌ No (needs build) |
| **Capture Method** | Manual button tap | Auto on blink |
| **Face Detection** | None (manual positioning) | Real-time ML detection |
| **Visual Feedback** | Dashed circle guide | Green/orange/red oval |
| **Cropping** | Square center crop | Face-only with padding |
| **Quality Checks** | None | Automatic validation |
| **User Experience** | Good | Excellent |
| **Professional Look** | ✓ | ✓✓✓ |

---

## When to Upgrade?

**Upgrade NOW if:**
- You're ready to create a development build
- You want the best user experience
- You want ML-powered features
- You're preparing for production release

**Stay with SimpleFaceCapture if:**
- You're still developing other features
- You want quick testing in Expo Go
- You haven't done development builds before
- The current version meets your needs

---

## Troubleshooting

### Issue: "Cannot find native module 'ExpoFaceDetector'"
**Solution:** You're using FaceCaptureCamera without a development build. Either:
1. Switch back to SimpleFaceCapture, OR
2. Run `npx expo prebuild --clean && npx expo run:ios`

### Issue: Build takes too long
**Solution:** First build is slow (10-15 min). Subsequent builds are faster (2-3 min).

### Issue: Face detection not working
**Solution:**
- Make sure you're in good lighting
- Face the camera directly
- Ensure only one person is in frame
- Check camera permissions are granted

---

## Files Reference

**Components:**
- `/mobile/src/components/SimpleFaceCapture.tsx` - Current basic camera
- `/mobile/src/components/FaceCaptureCamera.tsx` - Advanced ML camera (ready!)

**Used In:**
- `/mobile/src/screens/RegistrationScreen.tsx` - Registration flow

**Services:**
- `/mobile/src/services/faceVerification.ts` - Face photo upload to Supabase

---

## Questions?

If you need help with the upgrade:
1. Read this guide carefully
2. Check the Expo documentation: https://docs.expo.dev/develop/development-builds/
3. Make sure all packages are installed: `npm install`
4. Try the prebuild command first to see if there are any errors

**Remember:** The FaceCaptureCamera component is already coded and ready. You just need to build the app to use it!

---

**Last Updated:** 2025-10-29
**Status:** SimpleFaceCapture active, FaceCaptureCamera ready for upgrade
