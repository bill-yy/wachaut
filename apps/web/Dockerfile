FROM node:22-alpine AS builder
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build
RUN npm install
ENV VITE_WS_URL=wss://api-wachaut.billytech.es
RUN npm run build --workspace=@wachaut/web

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./node_modules
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "build"]