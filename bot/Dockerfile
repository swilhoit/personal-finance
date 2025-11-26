# MAMA Discord Bot Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies for build, then remove
RUN npm install typescript ts-node @types/node @types/node-cron && \
    npm run build && \
    npm prune --production

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Run the bot
CMD ["node", "dist/index.js"]
