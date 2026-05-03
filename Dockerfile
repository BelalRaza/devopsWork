# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma

# Install dependencies
RUN cd server && npm ci

# Copy server source code
COPY server/ ./server/

# Generate Prisma client
RUN cd server && npx prisma generate

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built server from the previous stage
COPY --from=build /app/server /app/server

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

WORKDIR /app/server

# Expose the application port
EXPOSE 5001

# Healthcheck to verify the service is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
