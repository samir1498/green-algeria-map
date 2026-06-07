# syntax=docker/dockerfile:1.7

FROM node:24.11-alpine3.22 AS base

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build
RUN pnpm prune --prod --config.ignore-scripts=true --config.confirmModulesPurge=false

FROM node:24.11-alpine3.22 AS runner

WORKDIR /app

RUN addgroup -S nodejs && \
    adduser -S nestjs -G nodejs

ENV NODE_ENV=production

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE 8080

CMD ["node", "dist/main"]
