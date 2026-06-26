# ══════════════════════════════════════════════════════════════════════
# Wachaut — Multi-stage Dockerfile
# Builds web, server, and SFU from a Turborepo+pnpm monorepo
# ══════════════════════════════════════════════════════════════════════

# ── Base ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Dependencies (web + server only, no mediasoup) ──────────────────
FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/ packages/

# Install only web+server deps (exclude SFU which has mediasoup)
RUN pnpm install --frozen-lockfile --filter @wachaut/web --filter @wachaut/server

# ── Build Web ───────────────────────────────────────────────────────
FROM dependencies AS web-builder
COPY apps/web/ apps/web/
COPY apps/server/ apps/server/
COPY packages/ packages/
ENV VITE_WS_URL=wss://api-wachaut.billytech.es
RUN pnpm --filter @wachaut/web build

# ── Build Server ────────────────────────────────────────────────────
FROM dependencies AS server-builder
COPY apps/web/ apps/web/
COPY apps/server/ apps/server/
COPY packages/ packages/
RUN pnpm --filter @wachaut/server build

# ── Production: Web ─────────────────────────────────────────────────
FROM node:22-bookworm-slim AS web
WORKDIR /app
COPY --from=web-builder /app/apps/web/build ./build
COPY --from=web-builder /app/apps/web/package.json ./
RUN npm install --omit=dev --legacy-peer-deps 2>/dev/null || true
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["npx", "serve", "build", "-l", "3000", "-s"]

# ── Production: Server ──────────────────────────────────────────────
FROM node:22-bookworm-slim AS server
WORKDIR /app
COPY --from=server-builder /app/apps/server/dist ./dist
COPY --from=server-builder /app/apps/server/package.json ./
RUN npm install --omit=dev --legacy-peer-deps 2>/dev/null || true
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
CMD ["node", "dist/index.js"]

# ── Dependencies (SFU with mediasoup) ───────────────────────────────
FROM base AS sfu-dependencies
ARG BUILD_TS=0
RUN echo "Build: $BUILD_TS" && apt-get update && apt-get install -y python3 python-is-python3 make g++ git && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/sfu/package.json apps/sfu/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# ── Production: SFU ─────────────────────────────────────────────────
FROM node:22-bookworm-slim AS sfu
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install tsx globally (avoids pnpm symlink issues)
RUN npm install -g tsx

# Copy node_modules from builder (includes mediasoup with native bindings)
COPY --from=sfu-dependencies /app/node_modules ./node_modules

# Copy SFU source
COPY apps/sfu/src ./src

ENV NODE_ENV=production
EXPOSE 3002
EXPOSE 20000-20100/udp

CMD ["tsx", "src/index.ts"]
