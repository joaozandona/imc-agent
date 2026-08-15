# syntax=docker/dockerfile:1

FROM node:22-bookworm AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm run build -w @imc/shared \
  && npm run build -w @imc/api

FROM node:22-bookworm AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333
ENV DB_PATH=/data/imc.sqlite
ENV NODE_PATH=/app/node_modules

# better-sqlite3 needs native build tooling in the final image install.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Fresh prod install avoids broken workspace symlinks from copying builder node_modules.
RUN npm ci --omit=dev -w @imc/api -w @imc/shared

COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

RUN sed -i 's/\r$//' ./apps/api/docker-entrypoint.sh \
  && chmod +x ./apps/api/docker-entrypoint.sh \
  && mkdir -p /data

EXPOSE 3333

ENTRYPOINT ["sh", "./apps/api/docker-entrypoint.sh"]
