# Personal Finance iOS App

This is the iOS mobile version of the Personal Finance app, built with React Native and Expo.

## Features

- 💰 Bank account integration via Plaid
- 📊 Financial insights and analytics
- 💬 AI-powered financial assistant
- 📱 Native iOS experience
- 🔐 Secure authentication with Supabase

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Supabase and Plaid credentials

3. **Run the app:**
   ```bash
   # Start the development server
   npm start

   # Run on iOS simulator
   npm run ios
   ```

## Project Structure

```
mobile-app/
├── src/
│   ├── config/         # Configuration files
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation setup
│   ├── screens/        # App screens
│   │   ├── auth/       # Authentication screens
│   │   └── ...         # Main app screens
│   └── types/          # TypeScript type definitions
├── assets/             # Images and assets
├── app.json           # Expo configuration
└── App.tsx            # Entry point
```

## Building for iOS

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build for iOS:**
   ```bash
   # Development build
   eas build --platform ios --profile development

   # Production build
   eas build --platform ios --profile production
   ```

## Testing on Physical Device

1. Install Expo Go from the App Store
2. Scan the QR code from the development server
3. Or use a development build with EAS

## Key Technologies

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **Supabase**: Backend and authentication
- **React Navigation**: Navigation library
- **Plaid React Native SDK**: Bank integration

## Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PLAID_PUBLIC_KEY=your_plaid_public_key
EXPO_PUBLIC_PLAID_ENV=sandbox
```

## Next Steps

- [ ] Implement full transaction management
- [ ] Add budget tracking features
- [ ] Integrate Plaid Link for bank connections
- [ ] Implement AI chat functionality
- [ ] Add push notifications
- [ ] Implement biometric authentication