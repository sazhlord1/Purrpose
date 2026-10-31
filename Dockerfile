# Purrpose API server (apps/server) as one container — used by Liara (Iranian edition).
# Builds only what the server needs: packages/shared + apps/server.
FROM node:22-bookworm-slim

# Prisma needs OpenSSL at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# 1) Dependencies (cached while package files don't change). Every workspace
#    package.json is copied so the lockfile matches; only the server's tree is installed.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/cats/package.json packages/cats/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN pnpm install --frozen-lockfile --filter "@purrpose/server..."

# 2) Source and build.
COPY packages/shared packages/shared
COPY apps/server apps/server
RUN pnpm --filter @purrpose/shared build \
  && pnpm --filter @purrpose/server exec prisma generate \
  && pnpm --filter @purrpose/server exec tsc -p tsconfig.json

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
EXPOSE 3000

# Bring the database schema up to date, then start. Migrations are idempotent.
CMD ["sh", "-c", "cd apps/server && npx prisma migrate deploy && node dist/index.js"]
