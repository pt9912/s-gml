# Release Notes - v1.7.1

**Release Date:** 2026-03-25

## Overview

This patch release combines the browser-safe package entry introduced earlier with a series of security, correctness, and type-safety fixes identified during a comprehensive code review.

---

## Highlights

### Browser-safe package entry

- Added a dedicated browser build at `dist/index.browser.js`
- Added a `browser` export condition on the package root
- Added explicit browser import support via `@npm9912/s-gml/browser`

```typescript
import { GmlParser, StreamingGmlParser } from '@npm9912/s-gml/browser';
```

- Removed the browser bundle path that previously pulled in `stream`
- Added explicit runtime errors for `ShapefileBuilder`, `GeoPackageBuilder`, `toShapefile()`, and `toGeoPackage()` in browser contexts

### Security: command injection fix in XML validator

`exec()` was replaced with `execFile()` for all `xmllint` invocations. Arguments are now passed as an array directly to the process, eliminating the shell as an intermediary and removing any possibility of argument injection through file path characters.

Additionally, the GML XSD schema URLs were upgraded from `http://` to `https://` to prevent MITM-based schema substitution during validation.

### Streaming parser: true incremental processing

`parseNodeStream()` previously accumulated all chunks into an in-memory array and only began processing after the `end` event — fully defeating the memory advantage of streaming. The implementation now processes each chunk as it arrives using `pause()`/`resume()` backpressure, matching the existing `parseWebStream()` behaviour.

### Streaming parser: improved buffer overflow recovery

After a buffer overflow the parser now enters a recovery mode that scans incoming chunks for the next feature start tag (`<gml:featureMember>` or `<wfs:member>`) before resuming normal parsing. Previously the entire buffer was discarded and subsequent chunks were appended to an empty string, producing corrupt XML for the remainder of the stream.

### GML Box coordinate parsing fix

`parseBox()` now correctly handles both `<gml:coordinates>` formats used in GML 2.1.2:

| Format | Example | Previously |
|--------|---------|------------|
| Comma-separated tuples | `"10,20 30,40"` | `Number("10,20")` → `NaN` (silent) |
| Flat space-separated | `"0 0 10 10"` | Worked correctly |

Both formats are now validated with an explicit `isNaN` check.

### Coverage type safety

Four `as any` casts were removed from `parseElement()`. `GmlCoverage` is now part of the return type union of `parseGml()` and `parseElement()`, so the TypeScript compiler can verify coverage handling end-to-end. `convert()` throws an explicit, descriptive error when called with a coverage object rather than silently passing it to `generateGml()`.

### WcsVersion type unified

`WcsVersion` is now defined once in `wcs/request-builder.ts` and re-exported by `wcs/capabilities-parser.ts`. The two files previously maintained independent, non-identical definitions — the capabilities parser supported `'1.1.1'` and `'1.1.2'` while the request builder did not, making it impossible to pass the parser's output directly to the builder. Both versions are now included in the canonical type.

### ESLint underscore-prefix convention

Added `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'` to the `no-unused-vars` rule so intentionally-unused parameters (e.g. `_options` in browser stub functions) are not flagged as errors.

---

## Security

| Finding | Severity | Fix |
|---------|----------|-----|
| `exec()` shell injection in xmllint validator | High | Replaced with `execFile()` |
| XSD schemas fetched over HTTP | Medium | Upgraded to HTTPS |

---

## Bug Fixes

- `parseBox()` no longer produces silent `NaN` coordinates for GML 2.1.2 comma-separated coordinate format
- `parseNodeStream()` no longer buffers the entire response before processing
- Buffer overflow recovery no longer corrupts subsequent stream data
- `convert()` no longer passes coverage objects to `generateGml()` silently

---

## Type System Improvements

- `GmlCoverage` added to `parseGml()` / `parseElement()` return type union
- `WcsVersion` unified — `'1.1.1'` and `'1.1.2'` added to the canonical type
- `on()` implementation overload typed without `any`
- `isNodeStream()` typed without `any`
- ESLint now correctly permits `_`-prefixed intentionally-unused parameters

---

## Installation

```bash
npm install @npm9912/s-gml@1.7.1
# oder
pnpm add @npm9912/s-gml@1.7.1
# oder
docker pull ghcr.io/pt9912/s-gml:1.7.1
```

---

## Test Statistics

- **529 Tests** — alle bestanden
- **29 Test Suites**

---

## Upgrade Notes

No breaking changes. All existing APIs remain compatible.

The `WcsVersion` type now includes `'1.1.1'` and `'1.1.2'` — code that exhaustively switches over this type may need a `default` branch added if the compiler warns about unhandled cases.
