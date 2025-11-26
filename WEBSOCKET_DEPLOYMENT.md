# WebSocket Server Deployment to hcloud

The WebSocket server (`websocket-server.js`) handles real-time voice communication with OpenAI's Realtime API. It needs to be deployed separately from Vercel since Vercel doesn't support persistent WebSocket connections.

## Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────┐
│   Next.js App   │────▶│  WebSocket Server   │────▶│  OpenAI     │
│   (Vercel)      │     │  (hcloud Container) │     │  Realtime   │
└─────────────────┘     └─────────────────────┘     └─────────────┘
```

## Quick Deployment (Docker)

### 1. SSH into your hcloud server

```bash
ssh root@your-hcloud-ip
```

### 2. Create the WebSocket service directory

```bash
mkdir -p /opt/mama-websocket
cd /opt/mama-websocket
```

### 3. Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install ws dotenv @supabase/supabase-js

# Copy server code
COPY websocket-server.js ./

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "websocket-server.js"]
```

### 4. Create docker-compose.yml

```yaml
version: '3.8'

services:
  websocket:
    build: .
    container_name: mama-websocket
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - PORT=8080
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5. Create .env file

```bash
cat > .env << 'EOF'
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://ymxhsdtagnalxebnskst.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EOF
```

### 6. Copy files from repo

```bash
# From your local machine
scp websocket-server.js root@your-hcloud-ip:/opt/mama-websocket/
scp package.json root@your-hcloud-ip:/opt/mama-websocket/
```

### 7. Build and run

```bash
docker compose up -d --build
```

### 8. Verify it's running

```bash
docker compose logs -f
```

You should see:
```
🚀 Starting OpenAI Realtime WebSocket Proxy Server
🎤 OpenAI Realtime WebSocket Proxy running on port 8080
```

## Configure Vercel Environment

After deployment, add this environment variable to your Vercel project:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | `wss://your-hcloud-ip:8080` |

If using a domain with SSL (recommended):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | `wss://ws.yourdomain.com` |

## SSL/TLS Setup (Recommended)

For production, use Nginx as a reverse proxy with Let's Encrypt SSL:

### 1. Install Nginx and Certbot

```bash
apt update
apt install nginx certbot python3-certbot-nginx
```

### 2. Configure Nginx

```nginx
# /etc/nginx/sites-available/websocket
server {
    listen 443 ssl;
    server_name ws.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/ws.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ws.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

### 3. Enable and get SSL certificate

```bash
ln -s /etc/nginx/sites-available/websocket /etc/nginx/sites-enabled/
certbot --nginx -d ws.yourdomain.com
systemctl restart nginx
```

## Monitoring

### View logs

```bash
docker compose logs -f websocket
```

### Check status

```bash
docker compose ps
```

### Restart service

```bash
docker compose restart
```

## Troubleshooting

### Connection refused
- Check that port 8080 is open in your firewall
- Verify the container is running: `docker compose ps`

### Authentication errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check that the Supabase URL matches your project

### OpenAI connection fails
- Verify `OPENAI_API_KEY` is valid
- Check you have access to the Realtime API

### WebSocket upgrades failing
- If using Nginx, ensure WebSocket proxy headers are set
- Check `proxy_read_timeout` is high enough
