FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @wachaut/web build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./
RUN npm install -g pnpm && pnpm install --prod
EXPOSE 3000
CMD ["node", "build"]
