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
# Install with --ignore-scripts to skip mediasoup postinstall (it's not needed for web/server)
RUN pnpm install --frozen-lockfile --filter @wachaut/web --filter @wachaut/server --config.ignore-scripts=true
# Only run esbuild postinstall (needed for vite build)
RUN node node_modules/.pnpm/esbuild@*/node_modules/esbuild/install.js 2>/dev/null || true
RUN pnpm --filter @wachaut/web build
RUN pnpm --filter @wachaut/server build

# ── Combined: Web + Server (LAST STAGE — default build target) ──────
FROM node:22-slim AS combined
WORKDIR /app

# Install tini (process supervisor) and curl (for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends tini curl && \
    rm -rf /var/lib/apt/lists/*

# Web (static files)
COPY --from=builder /app/apps/web/build ./web/build

# Server (node dist)
COPY --from=builder /app/apps/server/dist ./server/dist
COPY --from=builder /app/apps/server/package.json ./server/package.json
RUN cd server && npm install --omit=dev

# Install serve globally for static files
RUN npm install -g serve

# Run as non-root
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser

EXPOSE 3000 3001
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Healthcheck targets the API server (/health on :3001) rather than the static
# web server, so a crashed Node process actually fails the check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Web (port 3000) + Server (port 3001) simultaneously
ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "serve web/build -l 3000 -s & PORT=3001 node server/dist/index.js"]
