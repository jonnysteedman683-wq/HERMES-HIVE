# Stage 1: Build with Bun
FROM oven/bun:latest AS builder

# Set working directory
WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Production with Node.js
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# Use simple static server
RUN apk add --no-cache curl

# Serve the built frontend from /app/dist (index.html lives there, not at /app)
CMD ["npx", "serve", "-s", "dist"]