# WebSocket Server Deployment to Heroku

Your WebSocket server needs to be deployed separately from your Vercel app because Vercel doesn't support persistent WebSocket connections.

## Quick Deployment (Automated)

Run this script to automatically deploy to Heroku:
```bash
./deploy-websocket-heroku.sh
```

## Manual Deployment Steps

### 1. Create Heroku App
```bash
heroku create personal-finance-websocket
```

### 2. Set Environment Variables
```bash
heroku config:set NEXT_PUBLIC_SUPABASE_URL=https://ymxhsdtagnalxebnskst.supabase.co
heroku config:set OPENAI_API_KEY=your_openai_api_key_here
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here
```

### 3. Deploy
```bash
# Temporarily use the WebSocket-specific package.json
cp heroku-websocket-package.json package.json

# Add files and deploy
git add Procfile package.json websocket-server.js
git commit -m "Deploy WebSocket server to Heroku"
git push heroku main

# Restore your original package.json
git checkout package.json
```

### 4. Update Vercel Environment Variables

After deployment, get your Heroku app URL:
```bash
heroku info | grep "Web URL"
```

Then in your Vercel dashboard, add:
- **Variable Name**: `NEXT_PUBLIC_WEBSOCKET_URL`
- **Value**: `wss://your-heroku-app.herokuapp.com` (replace https with wss)

## Environment Variables Needed

Your Heroku app needs these environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_SUPABASE_URL` - https://ymxhsdtagnalxebnskst.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Testing

Once deployed, you can test your WebSocket server by visiting your Heroku app URL in a browser. You should see connection logs in the Heroku logs:

```bash
heroku logs --tail
```

## Troubleshooting

If the deployment fails:
1. Check Heroku logs: `heroku logs --tail`
2. Verify all environment variables are set: `heroku config`
3. Make sure your WebSocket server code is working locally first

## Current Status
- ✅ WebSocket server code exists (`websocket-server.js`)
- ✅ Procfile created for Heroku
- ✅ Minimal package.json created for WebSocket dependencies
- ✅ Deployment script ready
- ⏳ Need to deploy to Heroku
- ⏳ Need to set NEXT_PUBLIC_WEBSOCKET_URL in Vercel
