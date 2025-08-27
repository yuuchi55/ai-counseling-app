# Multi-stage build for production deployment

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/ai-counseling-app
COPY ai-counseling-app/package*.json ./
RUN npm ci --only=production
COPY ai-counseling-app/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Stage 3: Production Image
FROM node:18-alpine
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built applications
COPY --from=frontend-builder --chown=nodejs:nodejs /app/ai-counseling-app/.next ./ai-counseling-app/.next
COPY --from=frontend-builder --chown=nodejs:nodejs /app/ai-counseling-app/public ./ai-counseling-app/public
COPY --from=frontend-builder --chown=nodejs:nodejs /app/ai-counseling-app/package*.json ./ai-counseling-app/
COPY --from=frontend-builder --chown=nodejs:nodejs /app/ai-counseling-app/node_modules ./ai-counseling-app/node_modules

COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# Copy configuration files
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs config ./config

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "backend/src/server.js"]