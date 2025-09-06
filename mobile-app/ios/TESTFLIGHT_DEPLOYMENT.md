# TestFlight Deployment Guide

This guide will help you deploy your iOS app to TestFlight for testing push notifications and CallKit features.

## Prerequisites

✅ Apple Developer Account ($99/year subscription)
✅ Xcode installed and configured
✅ Fastlane installed (already done via Homebrew)

## Setup Steps

### 1. Configure Your Apple Developer Account

1. **Get your Team ID:**
   - Go to https://developer.apple.com/account
   - Sign in with your Apple ID
   - Click on "Membership" in the sidebar
   - Copy your Team ID (looks like: ABCDEF1234)

2. **Update Bundle Identifier:**
   - Choose a unique bundle identifier (e.g., `com.yourname.personalfinance`)
   - This must be unique across all App Store apps

### 2. Configure Environment Variables

```bash
cd /Volumes/LaCie/WEBDEV/mama\ ios/personal-finance-ios/mobile-app/ios
cp .env.example .env
nano .env  # or use your preferred editor
```

Update these values in `.env`:
- `APPLE_ID`: Your Apple ID email
- `TEAM_ID`: Your Team ID from step 1
- `MATCH_GIT_URL`: (Optional) Private GitHub repo for certificates

### 3. Update Project Configuration

Update the bundle identifier in Xcode:
```bash
# Open Xcode
open PersonalFinance.xcworkspace

# In Xcode:
# 1. Select the project in the navigator
# 2. Select the PersonalFinance target
# 3. Go to "Signing & Capabilities" tab
# 4. Update Bundle Identifier to your unique identifier
# 5. Select your Team from the dropdown
```

Or update via command line in Fastfile and Appfile:
- Replace `com.yourcompany.personalfinance` with your bundle identifier

### 4. Create App on App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - App Name: Personal Finance (or your preferred name)
   - Primary Language: English
   - Bundle ID: Select or create matching your project
   - SKU: Any unique identifier (e.g., PERSONALFINANCE001)

### 5. Setup Certificates (Optional but Recommended)

**Option A: Using Match (Recommended for teams)**
1. Create a private GitHub repository for certificates
2. Update `MATCH_GIT_URL` in `.env`
3. Run: `./deploy-testflight.sh` and select option 2

**Option B: Manual Setup**
- Let Xcode manage signing automatically (easier for individual developers)

### 6. Configure Push Notifications

1. In Xcode:
   - Select your project
   - Go to "Signing & Capabilities"
   - Click "+" → Add "Push Notifications"
   - Click "+" → Add "Background Modes"
   - Check: "Voice over IP", "Remote notifications"

2. Generate push certificates:
   ```bash
   ./deploy-testflight.sh
   # Select option 3
   ```

### 7. Deploy to TestFlight

Run the deployment script:
```bash
./deploy-testflight.sh
# Select option 1 for complete setup and deployment
# Or option 5 if setup is already complete
```

This will:
1. Setup certificates and provisioning profiles
2. Build the app
3. Upload to TestFlight
4. You'll receive an email when processing is complete

### 8. Test on TestFlight

1. **Internal Testing:**
   - Go to App Store Connect → Your App → TestFlight
   - Add internal testers (up to 100 Apple IDs)
   - They'll receive an invitation email

2. **External Testing:**
   - Submit for Beta App Review (usually takes 24-48 hours)
   - Add up to 10,000 external testers
   - Share public link or invite via email

## Common Issues and Solutions

### Issue: "No certificate for team ID found"
**Solution:** Run `./deploy-testflight.sh` and select option 2 to setup certificates

### Issue: "Bundle identifier already exists"
**Solution:** Choose a different unique bundle identifier

### Issue: Build fails with signing error
**Solution:** 
1. Open Xcode
2. Go to Preferences → Accounts
3. Add your Apple ID
4. Download manual provisioning profiles

### Issue: Push notifications not working
**Solution:**
1. Ensure you've added Push Notifications capability in Xcode
2. Generate push certificates: `./deploy-testflight.sh` option 3
3. Check entitlements file includes `aps-environment`

## Manual Commands

If you prefer to run fastlane commands manually:

```bash
# Setup certificates
fastlane setup_certs

# Build for local testing
fastlane build

# Deploy to TestFlight
fastlane beta

# Generate push certificates
fastlane push_certs
```

## Next Steps

After successful deployment:
1. Test push notifications on real devices
2. Test CallKit integration for incoming calls
3. Verify all features work as expected
4. Submit for App Store review when ready

## Support

- [Fastlane Documentation](https://docs.fastlane.tools)
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [TestFlight Documentation](https://developer.apple.com/testflight)