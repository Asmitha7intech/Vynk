# =============================================================
# VYNK API — PRODUCTION MULTI-STAGE DOCKERFILE
# =============================================================

# --- Stage 1: Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

# Copy root workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copy package manifests
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/types/ ./packages/types/
COPY packages/validation/ ./packages/validation/
COPY packages/database/ ./packages/database/
COPY packages/config/ ./packages/config/
COPY apps/api/ ./apps/api/

# Generate Prisma client and build packages
RUN pnpm --filter @vynk/types build || true
RUN pnpm --filter @vynk/validation build || true
RUN pnpm --filter @vynk/database db:generate
RUN pnpm --filter @vynk/api build

# --- Stage 2: Production Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

# Copy manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy compiled code and Prisma engine from builder
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create uploads directory and set permissions
RUN mkdir -p /app/data/uploads /app/data/lake && chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
