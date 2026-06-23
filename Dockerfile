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
RUN sed -i '/@wachaut\/shared-types/d' package.json && npm install --omit=dev
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "build"]

# Production stage for server
FROM node:22-alpine AS server
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
RUN sed -i '/@wachaut\/shared-types/d' package.json && npm install --omit=dev
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
CMD ["node", "dist/index.js"]