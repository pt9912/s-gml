# Build-Stage: Node 22 + pnpm
FROM node:22-alpine AS builder

WORKDIR /app

# Install libxml2-utils for xmllint and pnpm
RUN apk add --no-cache libxml2-utils && \
    corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod=false

# Kopiere Quellcode und baue
COPY . .
RUN pnpm run build
RUN pnpm test
RUN pnpm run lint

RUN pnpm prune --prod

# Runtime-Stage: Nur Node 22 (kein pnpm nötig)
FROM node:22-alpine

# OCI Labels für GitHub Container Registry
LABEL org.opencontainers.image.title="s-gml"
LABEL org.opencontainers.image.description="TypeScript library and CLI tool for parsing, converting, and validating GML (Geography Markup Language). Supports GML 2.1.2/3.0/3.2 and multiple output formats: GeoJSON, Shapefile, CSV, KML, WKT, CIS JSON, and CoverageJSON."
LABEL org.opencontainers.image.version="1.7.0"
LABEL org.opencontainers.image.authors="Dietmar Burkard"
LABEL org.opencontainers.image.url="https://github.com/pt9912/s-gml"
LABEL org.opencontainers.image.source="https://github.com/pt9912/s-gml"
LABEL org.opencontainers.image.documentation="https://github.com/pt9912/s-gml#readme"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install libxml2-utils for xmllint and pnpm
RUN apk add --no-cache libxml2-utils && \
    corepack enable && corepack prepare pnpm@latest --activate

# Kopiere nur notwendige Dateien
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist/
COPY entrypoint.sh .

# ESM-Unterstützung
ENV NODE_OPTIONS=--experimental-specifier-resolution=node

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
