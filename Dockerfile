# ══════════════════════════════════════════════════════════════════════
# Wachaut — Multi-stage Dockerfile
# Builds web + server from a Turborepo+pnpm monorepo
# SFU has its own Dockerfile (docker/Dockerfile.sfu)
# ══════════════════════════════════════════════════════════════════════

# ── Base ─────────────────────────────────────────────────────────────
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Build ───────────────────────────────────────────────────────────
FROM base AS builder
COPY . .
ENV VITE_WS_URL=wss://api-wachaut.billytech.es
RUN pnpm install --frozen-lockfile --filter @wachaut/web --filter @wachaut/server
RUN pnpm --filter @wachaut/web build
RUN pnpm --filter @wachaut/server build

# ── Production: Web ─────────────────────────────────────────────────
FROM node:22-slim AS web
WORKDIR /app
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./
RUN sed -i '/@wachaut\/shared-types/d' package.json 2>/dev/null; npm install --omit=dev --legacy-peer-deps 2>/dev/null || true
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["npx", "serve", "build", "-l", "3000", "-s"]

# ── Production: Server ──────────────────────────────────────────────
FROM node:22-slim AS server
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
RUN sed -i '/@wachaut\/shared-types/d' package.json 2>/dev/null; npm install --omit=dev --legacy-peer-deps 2>/dev/null || true
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
CMD ["node", "dist/index.js"]

# ── Combined: Web + Server (LAST STAGE — default build target) ──────
FROM node:22-slim AS combined
WORKDIR /app

# Web (static files)
COPY --from=builder /app/apps/web/build ./web/build

# Server (node dist)
COPY --from=builder /app/apps/server/dist ./server/dist
COPY --from=builder /app/apps/server/package.json ./server/package.json
RUN cd server && sed -i '/@wachaut\/shared-types/d' package.json 2>/dev/null && npm install --omit=dev --legacy-peer-deps 2>/dev/null || true

# Install serve globally for static files
RUN npm install -g serve

EXPOSE 3000 3001
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Web (port 3000) + Server (port 3001) simultaneously
CMD ["sh", "-c", "serve web/build -l 3000 -s & node server/dist/index.js"]
