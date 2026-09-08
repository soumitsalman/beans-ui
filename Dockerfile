# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack prepare pnpm@10.33.0 --activate \
  && pnpm install --frozen-lockfile

COPY . .

# SSR on Fly VMs. Skip baking `/` at build time so the homepage is not an empty
# or unauthorized snapshot from the builder (no Flycast, no API secrets).
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production
ENV NUXT_SKIP_HOME_PRERENDER=1
RUN pnpm build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080

RUN groupadd --system --gid 999 nuxt \
  && useradd --system --uid 999 --gid nuxt --home-dir /app --shell /usr/sbin/nologin nuxt

COPY --from=build --chown=nuxt:nuxt /app/.output ./.output

USER nuxt
EXPOSE 8080

# Map fly.toml / `fly secrets` names onto Nuxt runtimeConfig env overrides.
CMD ["sh", "-c", "export NUXT_CAFECITO_API_KEY=\"${NUXT_CAFECITO_API_KEY:-$CAFECITO_API_KEY}\"; export NUXT_BEANS_API_BASE_URL=\"${NUXT_BEANS_API_BASE_URL:-$BEANS_API_BASE_URL}\"; export NUXT_ESPRESSO_API_BASE_URL=\"${NUXT_ESPRESSO_API_BASE_URL:-$ESPRESSO_API_BASE_URL}\"; exec node .output/server/index.mjs"]
