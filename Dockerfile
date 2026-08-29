# -------------------------------------------------------------
# 1. Build Frontend Assets using Bun
# -------------------------------------------------------------
FROM oven/bun:1-alpine AS client-builder
WORKDIR /app/client
COPY client/package.json ./
RUN bun install
COPY client/ ./
RUN bun run build

# -------------------------------------------------------------
# 2. Build Backend Application using Bun
# -------------------------------------------------------------
FROM oven/bun:1-alpine AS server-builder
WORKDIR /app/server
COPY server/package.json ./
COPY server/prisma ./prisma/
RUN bun install
RUN bun x prisma generate
COPY server/ ./
RUN bun run build

# -------------------------------------------------------------
# 3. Production Runner Image using Bun
# -------------------------------------------------------------
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json ./
COPY server/prisma ./prisma/
RUN bun install --production
RUN bun x prisma generate

COPY --from=server-builder /app/server/src ./src
COPY --from=client-builder /app/client/dist ./public

EXPOSE 5000

CMD ["bun", "src/server.ts"]

