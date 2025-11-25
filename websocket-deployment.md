# WebSocket Server Deployment Guide

Your Vercel deployment is failing because WebSocket servers can't run on Vercel's serverless platform. Here are your options:

## Option 1: Deploy to Railway (Recommended - Easiest)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Create a separate repository for the WebSocket server:**
   ```bash
   mkdir personal-finance-websocket
   cd personal-finance-websocket
   ```

3. **Copy necessary files:**
   ```bash
   cp ../websocket-server.js ./
   cp ../package.json ./
   # Create a minimal package.json with only WebSocket dependencies
   ```

4. **Create a minimal package.json:**
   ```json
   {
     "name": "personal-finance-websocket",
     "version": "1.0.0",
     "main": "websocket-server.js",
     "scripts": {
       "start": "node websocket-server.js"
     },
     "dependencies": {
       "@supabase/supabase-js": "^2.54.0",
       "dotenv": "^17.2.2",
       "ws": "^8.18.3"
     }
   }
   ```

5. **Deploy to Railway:**
   ```bash
   railway login
   railway init
   railway up
   ```

6. **Set environment variables in Railway:**
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

7. **Get your Railway URL and update Vercel:**
   - In Vercel dashboard, add environment variable:
   - `NEXT_PUBLIC_WEBSOCKET_URL` = `wss://your-railway-app.railway.app`

## Option 2: Deploy to Render

1. **Create account at render.com**
2. **Connect your GitHub repo**
3. **Create new Web Service**
4. **Settings:**
   - Build Command: `npm install`
   - Start Command: `node websocket-server.js`
   - Add environment variables

## Option 3: Disable Realtime Voice (Quick Fix)

If you want to temporarily disable the feature:

1. **Comment out the WebSocket connection in the UI**
2. **Show an error message: "Realtime voice not available in production"**

## Current Status

- ❌ WebSocket server trying to connect to `localhost:8080`
- ❌ No `NEXT_PUBLIC_WEBSOCKET_URL` configured
- ✅ WebSocket server code exists and works locally
- ✅ Authentication flow is properly implemented

## Next Steps

Choose one of the options above and deploy your WebSocket server to a platform that supports persistent connections.
