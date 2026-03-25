# Release Notes - v1.7.1

**Release Date:** 2026-03-25

## Overview

This patch release fixes static browser imports for `@npm9912/s-gml`. Browser providers and bundlers no longer pull in `stream` through the package's browser-facing entry, while Node.js consumers keep the existing API.

---

## Highlights

### Browser-safe package entry

- Added a dedicated browser build at `dist/index.browser.js`
- Added a `browser` export condition on the package root
- Added explicit browser import support via `@npm9912/s-gml/browser`

```typescript
import { GmlParser, StreamingGmlParser } from '@npm9912/s-gml/browser';
```

### Static import fix for browser providers

- Removed the browser bundle path that previously pulled in `stream`
- Split parser wiring into shared logic plus Node/browser-specific wrappers
- Added browser-safe builder resolution for static imports

### Clear runtime guards for Node-only exports

The browser build now fails fast with clear errors for Node-only exports instead of leaking Node internals into the bundle:

- `ShapefileBuilder`
- `GeoPackageBuilder`
- `toShapefile()`
- `toGeoPackage()`

`FlatGeobufBuilder` remains available in browser builds.

---

## Detailed Changes

### Added

- Browser-specific package entry point
- Dedicated browser Rollup build
- Explicit `@npm9912/s-gml/browser` import path
- Browser compatibility tests for the new entry

### Changed

- Shared parser logic moved into a common base implementation
- Node and browser parser wrappers now select the appropriate builder resolver
- README updated with browser and bundler guidance

### Fixed

- Static imports of `@npm9912/s-gml` in browser providers no longer drag in `stream`
- Browser distribution is now free of `stream`, `fs`, `path`, `http`, and `os` imports

---

## Migration Guide

No migration is required for Node.js consumers.

For browser-only consumers, prefer one of these approaches:

### Option 1: Use the package root

Use `@npm9912/s-gml` if your bundler respects the `browser` export condition.

### Option 2: Use the explicit browser entry

Use `@npm9912/s-gml/browser` if you want an unambiguous browser-specific import path.

```typescript
import { GmlParser } from '@npm9912/s-gml/browser';
```

### Browser limitations

- Shapefile export remains Node-only
- GeoPackage export remains Node-only
- FlatGeobuf export remains browser-compatible

---

## Verification

This release was verified with:

- `pnpm run build`
- `pnpm test -- --runInBand test/browser-compat.test.ts`
- `pnpm test -- --runInBand test/parser.test.ts`
- `pnpm test -- --runInBand test/streaming-parser.test.ts`

---

## Installation

### npm

```bash
npm install @npm9912/s-gml@1.7.1
```

### pnpm

```bash
pnpm add @npm9912/s-gml@1.7.1
```

### yarn

```bash
yarn add @npm9912/s-gml@1.7.1
```

### Docker

```bash
docker pull ghcr.io/pt9912/s-gml:1.7.1
docker pull ghcr.io/pt9912/s-gml:latest
```

---

## Resources

- **Documentation:** See README.md for updated browser usage guidance
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **GitHub Release:** [v1.7.1](https://github.com/pt9912/s-gml/releases/tag/v1.7.1)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)
- **Docker:** [ghcr.io/pt9912/s-gml](https://github.com/pt9912/s-gml/pkgs/container/s-gml)

---

**Full Changelog:** [v1.7.0...v1.7.1](https://github.com/pt9912/s-gml/compare/v1.7.0...v1.7.1)
