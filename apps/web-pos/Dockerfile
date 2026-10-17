# ==========================================
# POS AI - Web POS Frontend (React / Vite)
# Multi-stage production build with Nginx
# ==========================================

# Stage 1: Build React/TypeScript bundle
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/web-pos/package.json ./apps/web-pos/

RUN npm ci

COPY packages/shared-types ./packages/shared-types
COPY apps/web-pos ./apps/web-pos

RUN npm run build --workspace=@pos-ai/shared-types
RUN npm run build --workspace=@pos-ai/web-pos

# Stage 2: Serve optimized static bundle with Nginx
FROM nginx:alpine AS runner

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets
COPY --from=builder /usr/src/app/apps/web-pos/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY apps/web-pos/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
