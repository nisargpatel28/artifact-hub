# ── Stage 1: install & build ──────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm@9.15.0

WORKDIR /repo

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json         ./packages/types/
COPY apps/api/package.json               ./apps/api/

# Install all workspace deps (needed for workspace:* links)
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.json                       ./
COPY packages/types/                     ./packages/types/
COPY apps/api/                           ./apps/api/

# Build
WORKDIR /repo/apps/api
RUN pnpm build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN npm install -g pnpm@9.15.0

WORKDIR /repo

# Copy workspace manifests (needed so pnpm can resolve the workspace link)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json         ./packages/types/
COPY apps/api/package.json               ./apps/api/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output and shared types source (referenced at runtime via workspace link)
COPY --from=builder /repo/packages/types/  ./packages/types/
COPY --from=builder /repo/apps/api/dist/   ./apps/api/dist/

WORKDIR /repo/apps/api

ENV NODE_ENV=production
EXPOSE ${PORT:-3001}

CMD ["node", "dist/apps/api/src/index.js"]
