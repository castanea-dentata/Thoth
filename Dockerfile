# Thoth - Dockerfile
# Multi-stage build: build the frontend with Vite, then serve with Node.js

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the frontend assets with Vite
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:24-alpine

WORKDIR /app

# Copy source files first
COPY . .

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built assets from builder (must come AFTER COPY . . to override)
COPY --from=builder /app/public/dist ./public/dist

# Generate Prisma client
RUN npx prisma generate

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]
