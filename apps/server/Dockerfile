FROM node:22-alpine AS builder
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build
RUN npm install
RUN npm run build --workspace=@wachaut/server

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./node_modules
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
CMD ["node", "dist/index.js"]
