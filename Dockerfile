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

# Stage 2: Production with static file server
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

# Use a simple static server
RUN npm install -g serve

CMD ["serve", "-s", "."]