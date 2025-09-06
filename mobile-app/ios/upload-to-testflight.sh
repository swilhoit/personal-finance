#!/bin/bash

# Upload to TestFlight Script
# This script builds and uploads the iOS app to TestFlight

echo "🚀 Starting TestFlight upload process..."

# Configuration
WORKSPACE="PersonalFinance.xcworkspace"
SCHEME="PersonalFinance"
ARCHIVE_PATH="build/PersonalFinance.xcarchive"
EXPORT_PATH="build"
USERNAME="samwilhoit@gmail.com"
APP_PASSWORD="ortb-ytvb-fwiv-yckb"

# Step 1: Clean build folder
echo "🧹 Cleaning build folder..."
rm -rf build
mkdir -p build

# Step 2: Build the archive (without code signing)
echo "🔨 Building archive..."
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -sdk iphoneos \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

if [ $? -ne 0 ]; then
  echo "❌ Archive failed"
  exit 1
fi

# Step 3: Export IPA
echo "📦 Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "../ExportOptions.plist" \
  -allowProvisioningUpdates

if [ $? -ne 0 ]; then
  echo "❌ Export failed"
  exit 1
fi

# Step 4: Upload to TestFlight
echo "☁️ Uploading to TestFlight..."
xcrun altool --upload-app \
  -f "$EXPORT_PATH/PersonalFinance.ipa" \
  -t ios \
  -u "$USERNAME" \
  -p "$APP_PASSWORD"

if [ $? -eq 0 ]; then
  echo "✅ Successfully uploaded to TestFlight!"
else
  echo "❌ Upload to TestFlight failed"
  exit 1
fi