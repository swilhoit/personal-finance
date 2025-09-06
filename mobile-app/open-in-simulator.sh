#!/bin/bash

echo "🚀 Opening Personal Finance app in iOS Simulator..."
echo ""

# Check if Expo Go is installed
if xcrun simctl listapps booted | grep -q "host.exp.Exponent"; then
    echo "✅ Expo Go is installed"
    echo "📱 Opening your app..."
    
    # Open the Expo URL in the simulator
    xcrun simctl openurl booted exp://localhost:8081
    
    echo ""
    echo "✨ Your app should now be opening in Expo Go!"
    echo "If it doesn't open automatically, open Expo Go manually and enter: exp://localhost:8081"
else
    echo "❌ Expo Go is not installed in the simulator"
    echo ""
    echo "To install Expo Go:"
    echo "1. In the iOS Simulator, open Safari"
    echo "2. Go to: https://apps.apple.com/app/expo-go/id982107779"
    echo "3. Click 'Get' to install"
    echo "4. Once installed, run this script again"
fi