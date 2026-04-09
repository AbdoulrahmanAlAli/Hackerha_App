FROM node:20-alpine AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

# =========================
# dependencies
# =========================
FROM base AS deps
RUN pnpm install --frozen-lockfile

# =========================
# development
# =========================
FROM deps AS development

COPY . .

EXPOSE 1000

CMD ["pnpm", "dev"]

# =========================
# build
# =========================
FROM deps AS builder

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# =========================
# production
# =========================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 1000

CMD ["node", "dist/server.js"]