# ============================================
# Kitsu Enterprise Frontend Dockerfile
# ============================================
# Supports multi-stage builds for development and production
#
# Build commands:
#   Development: docker build --target development -t kitsu-frontend:dev .
#   Production:  docker build --target production -t kitsu-frontend:prod .
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Enable and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Stage 2: Development
FROM node:20-alpine AS development

WORKDIR /app

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json ./

# Enable pnpm
RUN corepack enable

# Expose port
EXPOSE 3000

# Set environment for development
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default command for development
CMD ["pnpm", "dev"]

# Stage 3: Builder (for production)
FROM node:20-alpine AS builder

WORKDIR /app

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Build the application
RUN corepack enable && pnpm build

# Stage 4: Production
FROM node:20-alpine AS production

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Default command for production
CMD ["node", "server.js"]
