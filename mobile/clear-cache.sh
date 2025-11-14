#!/bin/bash

echo "🧹 Cleaning Expo and build caches..."

# Remove Expo cache
rm -rf .expo
echo "✓ Cleared .expo folder"

# Remove node_modules cache (optional - uncomment if needed)
# rm -rf node_modules
# echo "✓ Cleared node_modules"

# Clear npm cache
npm cache clean --force
echo "✓ Cleared npm cache"

# Clear Expo cache
npx expo start --clear
echo "✓ Cleared Expo bundler cache"

echo ""
echo "✅ All caches cleared!"
echo ""
echo "Next steps:"
echo "1. Stop the current Expo server (Ctrl+C if running)"
echo "2. Run: npx expo start --clear"
echo "3. Build a new Android APK with: eas build --platform android"
echo ""
