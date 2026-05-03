# Stage 1: Build
FROM node:20-slim AS build

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy server package files
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma

# Install dependencies
RUN cd server && npm ci

# Copy server source code
COPY server/ ./server/

# Generate Prisma client (targets both native and linux for production)
RUN cd server && npx prisma generate

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Install openssl (required by Prisma at runtime) and create non-root user
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup && useradd -r -g appgroup appuser

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
