#!/bin/bash

# Railway deployment script for WebSocket server
# Make sure you have Railway CLI installed: npm install -g @railway/cli

echo "🚀 Deploying WebSocket server to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Initialize Railway project
echo "📦 Initializing Railway project..."
railway init

# Set environment variables
echo "⚙️  Setting environment variables..."
echo "Please set these environment variables in your Railway dashboard:"
echo "1. OPENAI_API_KEY"
echo "2. NEXT_PUBLIC_SUPABASE_URL=https://ymxhsdtagnalxebnskst.supabase.co"
echo "3. SUPABASE_SERVICE_ROLE_KEY"

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Go to your Railway dashboard and set the environment variables"
echo "2. Copy your Railway app URL"
echo "3. In Vercel, set NEXT_PUBLIC_WEBSOCKET_URL to: wss://your-app.railway.app"
