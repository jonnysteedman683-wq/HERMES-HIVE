FROM oven/bun:latest AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files from builder stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json

# Install production dependencies
RUN npm ci --omit=dev --prefer-offline

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]