#!/bin/bash

echo "Personal Finance iOS App - Development Setup"
echo "============================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your Supabase and Plaid credentials"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting iOS app..."
echo ""
echo "Options:"
echo "1. Press 'i' to open iOS simulator"
echo "2. Scan QR code with Expo Go app on physical device"
echo "3. Press 'w' to open in web browser"
echo ""

npm run ios