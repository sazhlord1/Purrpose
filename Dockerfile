# Purrpose — Iranian edition on Liara: one container serves the API *and* the Persian
# website (VITE_EDITION=ir: Persian only, no Stripe, no Google, nothing loaded from abroad).
# The English edition is not built from this file (Render + Cloudflare).

# ---- Stage 1: the website (runs in parallel with stage 2) ----
FROM node:22-bookworm-slim AS web
RUN npm install -g pnpm@10 --no-fund --no-audit || (sleep 5 && npm install -g pnpm@10 --no-fund --no-audit)
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/cats/package.json packages/cats/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN pnpm install --frozen-lockfile --filter "@purrpose/web..."
COPY packages/shared packages/shared
COPY packages/cats packages/cats
COPY apps/web apps/web
# Same address as the API, so the site calls /api/... directly (no CORS).
ENV VITE_EDITION=ir VITE_API_URL=
RUN cd apps/web && pnpm exec vite build

# ---- Stage 2: the API server ----
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10 --no-fund --no-audit || (sleep 5 && npm install -g pnpm@10 --no-fund --no-audit)
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/cats/package.json packages/cats/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN pnpm install --frozen-lockfile --filter "@purrpose/server..."
COPY packages/shared packages/shared
COPY apps/server apps/server
RUN pnpm --filter @purrpose/shared build \
 && pnpm --filter @purrpose/server exec prisma generate \
 && pnpm --filter @purrpose/server exec tsc -p tsconfig.json
COPY --from=web /app/apps/web/dist /app/web
# Landing page for purrpose.ir / www.purrpose.ir (static, made by scripts/sync-landing-ir.mjs).
COPY apps/landing-ir /app/landing
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 WEB_DIST=/app/web LANDING_DIST=/app/landing PRISMA_HIDE_UPDATE_MESSAGE=1 NPM_CONFIG_UPDATE_NOTIFIER=false
EXPOSE 3000
CMD ["sh", "-c", "cd apps/server && npx prisma migrate deploy && node dist/index.js"]
