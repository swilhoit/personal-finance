#!/bin/bash

echo "🚀 Launching Personal Finance iOS App in Simulator"
echo "=================================================="
echo ""

# Wait for iOS runtime download if needed
echo "⏳ Checking iOS runtime status..."
if ! xcrun simctl list runtimes | grep -q "iOS"; then
    echo "⏳ Waiting for iOS runtime to finish downloading..."
    while ! xcrun simctl list runtimes | grep -q "iOS"; do
        sleep 5
    done
fi

echo "✅ iOS runtime available"
echo ""

# Get the iOS runtime identifier
RUNTIME=$(xcrun simctl list runtimes | grep iOS | head -1 | awk '{print $NF}')
echo "📱 Using runtime: $RUNTIME"

# Check if iPhone 15 Pro exists, if not create it
if ! xcrun simctl list devices | grep -q "iPhone 15 Pro"; then
    echo "📱 Creating iPhone 15 Pro simulator..."
    DEVICE_ID=$(xcrun simctl create "iPhone 15 Pro" "iPhone 15 Pro" $RUNTIME)
    echo "✅ Created device: $DEVICE_ID"
else
    DEVICE_ID=$(xcrun simctl list devices | grep "iPhone 15 Pro" | head -1 | grep -o '[A-F0-9-]\{36\}')
    echo "📱 Using existing device: $DEVICE_ID"
fi

# Boot the device if not already booted
if ! xcrun simctl list devices | grep "iPhone 15 Pro" | grep -q "Booted"; then
    echo "🔌 Booting iPhone 15 Pro..."
    xcrun simctl boot $DEVICE_ID
    sleep 5
fi

# Open Simulator app
echo "📱 Opening Simulator..."
open -a Simulator

# Launch the app
echo "🚀 Starting React Native app..."
cd "$(dirname "$0")"
npm run ios

echo ""
echo "✅ App should now be running in the iOS Simulator!"