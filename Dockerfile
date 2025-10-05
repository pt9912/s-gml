# Build-Stage: Node 22 + pnpm
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Kopiere nur package.json und pnpm-lock.yaml für besseres Caching
#COPY package.json pnpm-lock.yaml ./
#RUN pnpm install --frozen-lockfile
COPY package.json ./
RUN pnpm install --prod=false


# Kopiere Quellcode und baue
COPY . .
RUN pnpm run build
RUN pnpm test
RUN pnpm run test:coverage
RUN pnpm run lint

# Runtime-Stage: Nur Node 22 (kein pnpm nötig)
FROM node:22-alpine

WORKDIR /app

# Kopiere nur notwendige Dateien
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/package.json ./
COPY entrypoint.sh .

# ESM-Unterstützung
ENV NODE_OPTIONS=--experimental-specifier-resolution=node

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
