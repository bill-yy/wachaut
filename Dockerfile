# ══════════════════════════════════════════════════════════════════════
# Wachaut — Multi-stage Dockerfile
# Builds web + server from a pnpm monorepo.
# Two final targets: `web` (static) and `server` (Node API).
# SFU has its own Dockerfile (docker/Dockerfile.sfu)
# ══════════════════════════════════════════════════════════════════════

# ── Base ─────────────────────────────────────────────────────────────
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ── Build ───────────────────────────────────────────────────────────
FROM base AS builder
# Copy lockfile + workspace manifests first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
# Install with --ignore-scripts to skip mediasoup postinstall (not needed for web/server)
RUN pnpm install --frozen-lockfile --filter @wachaut/web --filter @wachaut/server --config.ignore-scripts=true
# Run esbuild postinstall manually (needed for vite build)
RUN node node_modules/.pnpm/esbuild@*/node_modules/esbuild/install.js 2>/dev/null || true
# Now copy the rest of the source and build
COPY . .
ENV VITE_WS_URL=wss://wachaut.billytech.es
ENV VITE_SFU_URL=wss://sfu-wachaut.billytech.es
RUN pnpm --filter @wachaut/web build
RUN pnpm --filter @wachaut/server build

# ── Web (static files served by `serve`) ────────────────────────────
FROM node:22-slim AS web
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends tini && \
    rm -rf /var/lib/apt/lists/*
RUN npm install -g serve
COPY --from=builder /app/apps/web/build ./web/build
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT ["tini", "--"]
CMD ["serve", "web/build", "-l", "3000", "-s"]

# ── Server (Node API + Socket.IO + Admin) ────────────────────────────
FROM node:22-slim AS server
WORKDIR /app
# python3 make g++ needed for better-sqlite3 native compilation.
RUN apt-get update && apt-get install -y --no-install-recommends tini curl python3 make g++ && \
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/apps/server/dist ./server/dist
COPY --from=builder /app/apps/server/package.json ./server/package.json
RUN cd server && npm install --omit=dev
# Create data directory for SQLite (writable by appuser).
RUN mkdir -p /app/server/data && chown 1001:1001 /app/server/data
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
ENV WACHAUT_DB_PATH=/app/server/data/wachaut.db
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
ENTRYPOINT ["tini", "--"]
CMD ["node", "server/dist/index.js"]
