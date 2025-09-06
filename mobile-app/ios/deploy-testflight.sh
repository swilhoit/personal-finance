#!/bin/bash

# Deploy to TestFlight Script
# This script helps you deploy your iOS app to TestFlight

set -e

echo "🚀 iOS TestFlight Deployment Script"
echo "===================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and fill in your credentials:"
    echo ""
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$APPLE_ID" ] || [ "$APPLE_ID" == "your-apple-id@example.com" ]; then
    echo "❌ APPLE_ID not configured in .env file"
    exit 1
fi

if [ -z "$TEAM_ID" ] || [ "$TEAM_ID" == "XXXXXXXXXX" ]; then
    echo "❌ TEAM_ID not configured in .env file"
    echo "You can find your Team ID at: https://developer.apple.com/account"
    exit 1
fi

# Function to setup certificates
setup_certificates() {
    echo "📝 Setting up certificates and provisioning profiles..."
    echo ""
    
    if [ -z "$MATCH_GIT_URL" ] || [ "$MATCH_GIT_URL" == "https://github.com/your-username/certificates" ]; then
        echo "⚠️  MATCH_GIT_URL not configured"
        echo "Please create a private GitHub repository for storing certificates"
        echo "Then update MATCH_GIT_URL in your .env file"
        echo ""
        read -p "Do you want to continue without Match? (y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        return
    fi
    
    fastlane setup_certs
}

# Function to register push notification certificates
setup_push_notifications() {
    echo "🔔 Setting up push notification certificates..."
    echo ""
    
    read -p "Do you want to create push notification certificates? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        fastlane push_certs
    fi
}

# Function to build and deploy
deploy_to_testflight() {
    echo "🏗️  Building and deploying to TestFlight..."
    echo ""
    
    # Run the beta lane
    fastlane beta
}

# Main menu
echo "What would you like to do?"
echo ""
echo "1) Complete setup and deploy to TestFlight"
echo "2) Setup certificates only"
echo "3) Setup push notifications only"
echo "4) Build for local testing"
echo "5) Deploy to TestFlight (assumes setup is complete)"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        setup_certificates
        setup_push_notifications
        deploy_to_testflight
        ;;
    2)
        setup_certificates
        ;;
    3)
        setup_push_notifications
        ;;
    4)
        fastlane build
        ;;
    5)
        deploy_to_testflight
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"