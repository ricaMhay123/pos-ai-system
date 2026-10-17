# ==========================================
# POS AI - API Gateway (NestJS) Dockerfile
# Multi-stage production build
# ==========================================

# Stage 1: Build workspace packages
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install system utilities needed for building native modules
RUN apk add --no-cache python3 make g++

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/web-pos/package.json ./apps/web-pos/

# Install full dependencies
RUN npm ci

# Copy shared-types and api-gateway source code
COPY packages/shared-types ./packages/shared-types
COPY apps/api-gateway ./apps/api-gateway

# Build shared-types first, then api-gateway
RUN npm run build --workspace=@pos-ai/shared-types
RUN npm run build --workspace=@pos-ai/api-gateway

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/web-pos/package.json ./apps/web-pos/

RUN npm ci --omit=dev

# Copy compiled artifacts from builder stage
COPY --from=builder /usr/src/app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /usr/src/app/apps/api-gateway/dist ./apps/api-gateway/dist

# Security: Run as non-root node user
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/products || exit 1

CMD ["node", "apps/api-gateway/dist/main.js"]
