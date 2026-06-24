FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy all files first (works with any build context)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build both apps
ENV VITE_WS_URL=wss://api-wachaut.billytech.es
RUN pnpm --filter @wachaut/web build
RUN pnpm --filter @wachaut/server build

# Production stage for web
FROM node:22-alpine AS web
WORKDIR /app
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./
RUN sed -i '/@wachaut\\/shared-types/d' package.json && npm install --omit=dev --legacy-peer-deps
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["npx", "serve", "build", "-l", "3000", "-s"]

# Production stage for server
FROM node:22-alpine AS server
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
RUN sed -i '/@wachaut\/shared-types/d' package.json && npm install --omit=dev --legacy-peer-deps
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
CMD ["node", "dist/index.js"]

# Combined stage - runs both web and server
FROM node:22-alpine AS combined
WORKDIR /app

# Install web
COPY --from=builder /app/apps/web/build ./web/build
COPY --from=builder /app/apps/web/package.json ./web/package.json
RUN cd web && sed -i '/@wachaut\/shared-types/d' package.json && npm install --omit=dev --legacy-peer-deps

# Install server
COPY --from=builder /app/apps/server/dist ./server/dist
COPY --from=builder /app/apps/server/package.json ./server/package.json
RUN cd server && sed -i '/@wachaut\/shared-types/d' package.json && npm install --omit=dev --legacy-peer-deps

EXPOSE 3000 3001
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["sh", "-c", "(cd /app/web && npx serve build -l 3000 -s) & (cd /app/server && PORT=3001 HOST=0.0.0.0 node dist/index.js) & wait"]