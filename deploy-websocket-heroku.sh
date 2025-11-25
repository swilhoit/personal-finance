#!/bin/bash

# Heroku deployment script for WebSocket server
echo "🚀 Deploying WebSocket server to Heroku..."

# Create Heroku app for WebSocket server
APP_NAME="personal-finance-websocket-$(date +%s)"
echo "📦 Creating Heroku app: $APP_NAME"

heroku create $APP_NAME

# Set environment variables
echo "⚙️  Setting environment variables..."
heroku config:set NEXT_PUBLIC_SUPABASE_URL=https://ymxhsdtagnalxebnskst.supabase.co --app $APP_NAME

echo "🔑 Please set your OpenAI API key:"
read -p "Enter your OpenAI API key: " OPENAI_KEY
heroku config:set OPENAI_API_KEY="$OPENAI_KEY" --app $APP_NAME

echo "🔑 Please set your Supabase service role key:"
read -s -p "Enter your Supabase service role key: " SUPABASE_KEY
echo
heroku config:set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_KEY" --app $APP_NAME

# Copy the minimal package.json for Heroku
cp heroku-websocket-package.json package.json

# Add and commit files for Heroku
git add Procfile package.json websocket-server.js
git commit -m "Add WebSocket server for Heroku deployment"

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git push heroku main

# Get the app URL
APP_URL=$(heroku info --app $APP_NAME | grep "Web URL" | awk '{print $3}')
WSS_URL=$(echo $APP_URL | sed 's/https:/wss:/')

echo "✅ Deployment complete!"
echo "📝 Your WebSocket server is deployed at: $APP_URL"
echo "🔌 WebSocket URL: $WSS_URL"
echo ""
echo "🎯 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add environment variable: NEXT_PUBLIC_WEBSOCKET_URL=$WSS_URL"
echo "3. Redeploy your Vercel app"
echo ""
echo "🧪 Test your WebSocket connection at: $APP_URL"

# Restore original package.json
git checkout package.json
