# Release Notes - v1.1.4

**Release Date:** 2025-10-06

## 🎉 Overview

This release adds full browser compatibility by splitting the validator into separate browser and Node.js versions. The npm package is now compatible with modern bundlers like Vite, Webpack, and esbuild, while the CLI tool retains native xmllint performance.

---

## ✨ Highlights

### 🌐 Browser Compatibility

**Validator Split:**
- **`validator.browser.ts`** - WASM-only validation using Fetch API (browser-compatible)
- **`validator.node.ts`** - Native xmllint support for Node.js/CLI (up to 6x faster)
- npm package exports browser validator by default
- CLI tool uses Node.js validator with full performance

**Fixed Issues:**
- ✅ Resolved "Module externalized for browser compatibility" errors in Vite
- ✅ No more Node.js built-in modules (child_process, fs, http) in browser bundles
- ✅ Works with all modern bundlers (Vite, Webpack, Rollup, esbuild)

### 🧪 Enhanced Testing

**Browser Compatibility Tests:**
- 12 new tests ensuring browser compatibility
- Static analysis: verifies no Node.js imports in browser code
- Build verification: checks dist bundles for correct validator usage
- **Total: 175 tests** (up from 163)

---

## 🔧 Detailed Changes

### Added

- **Browser-compatible validator** (`validator.browser.ts`)
  - Uses xmllint-wasm for XSD validation
  - Uses browser Fetch API for HTTP requests
  - No Node.js dependencies

- **Node.js-specific validator** (`validator.node.ts`)
  - Native xmllint support (6x faster in Docker)
  - Automatic fallback to WASM if xmllint not available
  - Uses Node.js http/https modules

- **Browser compatibility test suite** (`test/browser-compat.test.ts`)
  - 12 tests for import verification
  - Distribution build checks
  - Export validation

### Changed

- **index.ts**: Exports browser validator by default for npm package
- **cli.ts**: Uses Node.js validator for CLI tool
- **Rollup configs**: Mark Node.js built-ins as external
  - `node:child_process`, `node:http`, `node:https`
  - `node:fs/promises`, `node:os`, `node:path`, `node:util`

### Fixed

- Browser compatibility errors with Vite/bundlers
- "Module externalized for browser compatibility" warnings
- Node.js modules being bundled in browser builds

---

## 📊 Test Coverage

```
File                   | % Stmts | % Branch | % Funcs | % Lines
-----------------------|---------|----------|---------|----------
validator.browser.ts   |   70.73 |    26.31 |   83.33 |   69.23
validator.node.ts      |   18.88 |        0 |       0 |   19.54
```

**Total:** 175 tests passing (10 test suites)

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

---

## 📝 Commit Summary

This release includes 3 commits since v1.1.3:

1. **12b580d** - feat: split validator into browser and Node.js versions
2. **a08ace6** - test: add browser compatibility tests
3. **718c210** - merge: browser compatibility features into main

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.1.3.

### For npm Package Users

The package now works in browsers! Use it with any bundler:

```typescript
import { validateGml } from '@npm9912/s-gml';

// Works in browser with Vite, Webpack, etc.
const isValid = await validateGml(gmlXml, '3.2');
```

### For CLI Users

No changes required. The CLI automatically uses the faster Node.js validator:

```bash
docker run --rm -v $(pwd):/data s-gml-cli validate /data/input.gml --gml-version 3.2
```

---

## 🧪 Testing

All tests pass successfully:

```bash
pnpm test
# Test Suites: 10 passed, 10 total
# Tests:       175 passed, 175 total
```

Browser compatibility verified:
- ✅ No Node.js imports in validator.browser.ts
- ✅ Fetch API used for HTTP requests
- ✅ dist/index.js contains browser validator
- ✅ dist/cli.js contains Node.js validator

---

## 📦 Installation

```bash
npm install @npm9912/s-gml@1.1.4
```

## 🐳 Docker

```bash
docker build -t s-gml-cli .
docker run --rm -v $(pwd):/data s-gml-cli validate /data/input.gml --gml-version 3.2
```

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure optimal browser compatibility and performance.

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)

---

## 🔜 What's Next

Future improvements may include:
- Further coverage improvements for validator.node.ts
- Additional WFS version support
- Performance optimizations for large FeatureCollections
- Enhanced schema catalog for complex GML applications

---

**Full Changelog:** [v1.1.3...v1.1.4](https://github.com/pt9912/s-gml/compare/v1.1.3...v1.1.4)
