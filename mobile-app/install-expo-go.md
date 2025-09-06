# Installing Expo Go on iOS Simulator

Since the App Store links don't work directly in the simulator, here are alternative methods to install Expo Go:

## Method 1: Using Expo CLI (Recommended)
The app is already running in your web browser. To view it in the iOS Simulator with Expo Go:

1. First, make sure the dev server is running (it already is at http://localhost:8081)

2. Open the iOS Simulator manually:
   ```bash
   open -a Simulator
   ```

3. In the Simulator, open Safari and go to:
   ```
   http://localhost:8081
   ```

4. You'll see the Expo developer menu. Click on "Open in Expo Go" if available.

## Method 2: Build Development Client
Since Expo Go installation is problematic, you can build a development client:

```bash
cd /Volumes/LaCie/WEBDEV/mama\ ios/personal-finance-ios/mobile-app
npx expo prebuild --clean
npx expo run:ios
```

## Method 3: Use Web Version
The app is fully functional in the web browser at:
```
http://localhost:8081
```

## Current Status
✅ All 4 tabs implemented:
- Transactions: Monthly transaction list with search and filtering
- Chat: AI financial assistant
- Accounts: Bank account management  
- Insights: Analytics and spending charts

The app is running successfully in the web browser. All features are functional and connected to Supabase.