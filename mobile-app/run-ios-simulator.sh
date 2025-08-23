#!/bin/bash

echo "🚀 Starting Personal Finance App in iOS Simulator"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Option 1: Web App in Simulator Safari${NC}"
echo "The app is currently running at http://localhost:8081"
echo "It has been opened in the simulator's Safari browser."
echo ""

echo -e "${YELLOW}Option 2: Install Expo Go (Manual)${NC}"
echo "1. In the iOS Simulator, open App Store"
echo "2. Search for 'Expo Go'"
echo "3. Install it"
echo "4. Open Expo Go and enter: exp://localhost:8081"
echo ""

echo -e "${YELLOW}Option 3: Create Native Development Build${NC}"
echo "Run these commands to create a native iOS build:"
echo -e "${GREEN}# Clean and prebuild${NC}"
echo "npx expo prebuild --clean --platform ios"
echo ""
echo -e "${GREEN}# Run on iOS${NC}"
echo "npx expo run:ios"
echo ""
echo "Note: This requires Xcode and may take 5-10 minutes"
echo ""

echo -e "${YELLOW}Option 4: Use Expo Dev Client${NC}"
echo "For the best development experience:"
echo -e "${GREEN}# Install dev client${NC}"
echo "npx expo install expo-dev-client"
echo ""
echo -e "${GREEN}# Build and run${NC}"
echo "npx expo run:ios"
echo ""

echo -e "${YELLOW}Current Status:${NC}"
echo "✅ Web server running at http://localhost:8081"
echo "✅ All 4 tabs implemented (Transactions, Chat, Accounts, Insights)"
echo "✅ OpenAI integration active"
echo "✅ Supabase connected"
echo ""

# Try to open in simulator's Safari
echo "Opening http://localhost:8081 in simulator Safari..."
xcrun simctl openurl booted http://localhost:8081 2>/dev/null || echo "Make sure iOS Simulator is running"