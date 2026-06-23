FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile
COPY . .
ENV VITE_WS_URL=wss://wachaut.billytech.es
RUN pnpm --filter @wachaut/web build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./node_modules
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build"]
