# Release Notes - v1.6.0

**Release Date:** 2025-10-16

## 🎉 Overview

This release adds **Shapefile export support**, **CLI multi-format capabilities** (7 output formats), comprehensive **builder integration tests**, and enhanced **developer tooling** with automated version management. s-gml is now a complete GML/WFS/WCS solution with support for all major geospatial output formats.

---

## ✨ Highlights

### 📦 Shapefile Builder with ZIP Export

**Full support for generating ESRI Shapefiles from GML data with automatic ZIP packaging:**

```typescript
import { ShapefileBuilder, GmlParser } from '@npm9912/s-gml';

const builder = new ShapefileBuilder();
const parser = new GmlParser(builder);
const geojson = await parser.parse(gmlData);

// Export as Shapefile ZIP (Node.js)
const zipBuffer = await builder.toZip(geojson, {
    outputType: 'nodebuffer',
    filename: 'my-data',
});

// Export as Shapefile ZIP (Browser)
const zipBlob = await builder.toZip(geojson, {
    outputType: 'blob',
    filename: 'my-data',
});
```

**Features:**
- ZIP archive contains `.shp`, `.shx`, `.dbf`, and `.prj` files
- Support for both Node.js Buffer and browser Blob outputs
- Based on `@mapbox/shp-write` with TypeScript type definitions
- 8 comprehensive tests for Shapefile generation

### 🔧 CLI Multi-Format Support

**The CLI now supports 7 different output formats via the `--format` option:**

```bash
# GeoJSON (default)
s-gml parse input.gml

# Shapefile ZIP
s-gml parse input.gml --format shapefile --output output.zip

# CSV with WKT geometry
s-gml parse input.gml --format csv > output.csv

# KML for Google Earth
s-gml parse input.gml --format kml > output.kml

# WKT Collection
s-gml parse input.gml --format wkt > output.json

# CIS JSON (Coverage Implementation Schema)
s-gml parse coverage.gml --format cis-json

# CoverageJSON (web-optimized coverage format)
s-gml parse coverage.gml --format coveragejson
```

**Supported Formats:**
- `geojson` - GeoJSON (default)
- `shapefile` / `shp` - ESRI Shapefile ZIP
- `csv` - CSV with WKT geometry
- `kml` - Google Earth KML
- `wkt` - WKT Collection (JSON)
- `cis-json` / `json-coverage` - CIS JSON
- `coveragejson` / `covjson` - CoverageJSON

### 🧪 Comprehensive Builder Integration Tests

**18 new integration tests covering all builders and format aliases:**

- ✅ All 7 output formats tested
- ✅ Format aliases validated (`shp`, `json-coverage`, `covjson`)
- ✅ Shapefile ZIP conversion
- ✅ Mixed geometry types in FeatureCollections
- **Total: 414 tests** (up from 396)

### 🚀 Version Bump Automation

**New automation script for managing releases:**

```bash
npm run version:bump 1.7.0
```

Automatically updates:
- `package.json`
- `Dockerfile` OCI labels
- `src/cli.ts` version string
- `CHANGELOG.md` with new section and comparison links

### 🐳 Docker OCI Labels

**Enhanced container metadata for GitHub Container Registry:**

```dockerfile
LABEL org.opencontainers.image.description="TypeScript library and CLI tool for parsing, converting, and validating GML"
LABEL org.opencontainers.image.title="s-gml"
LABEL org.opencontainers.image.version="1.6.0"
LABEL org.opencontainers.image.authors="Dietmar Burkard"
LABEL org.opencontainers.image.url="https://github.com/pt9912/s-gml"
LABEL org.opencontainers.image.source="https://github.com/pt9912/s-gml"
LABEL org.opencontainers.image.documentation="https://github.com/pt9912/s-gml#readme"
LABEL org.opencontainers.image.licenses="MIT"
```

---

## 🔧 Detailed Changes

### Added

- **Shapefile Builder with ZIP Export**
  - New `ShapefileBuilder` class that delegates to GeoJsonBuilder
  - `toZip()` method using @mapbox/shp-write for ESRI Shapefile generation
  - Support for both Node.js Buffer and browser Blob outputs
  - ZIP archive contains .shp, .shx, .dbf, and .prj files
  - TypeScript type definitions for @mapbox/shp-write
  - 8 comprehensive tests for Shapefile generation

- **CLI Multi-Format Support**
  - `--format` option for parse command supporting 7 output formats
  - Formats: geojson, shapefile, csv, kml, wkt, cis-json, coveragejson
  - Format-specific output handling (JSON, text, binary)
  - Proper CSV escaping for special characters
  - Binary Shapefile ZIP output (requires --output file)

- **Builder Integration Tests**
  - 18 new comprehensive integration tests
  - Tests for all builders via getBuilder() function
  - Tests for format aliases (shp, json-coverage, covjson)
  - Tests for Shapefile ZIP conversion
  - Tests for mixed geometry types in FeatureCollections
  - Total test count: 414 tests (up from 396)

- **Version Bump Automation**
  - `scripts/bump-version.js` for automated version updates
  - Updates package.json, Dockerfile, src/cli.ts, CHANGELOG.md
  - Validates semantic version format (x.y.z)
  - Creates new CHANGELOG section with comparison links
  - npm script: `npm run version:bump <version>`

- **Docker OCI Labels**
  - Added org.opencontainers.image.description label
  - Standard OCI labels: title, version, authors, url, source, documentation, licenses
  - Improved metadata display on GitHub Container Registry

### Changed

- **README.md**
  - Added comprehensive Shapefile builder documentation
  - Added CLI --format option examples for all 7 formats
  - Added binary Shapefile ZIP output examples (Node.js & browser)
  - Updated feature matrix to include Shapefile support
  - Added CLI usage examples with all output formats

### Fixed

- **Parser Builder Architecture**
  - Parser now correctly uses `builder.buildFeatureCollection()` and `builder.buildFeature()`
  - Removed redundant `toGeoJsonFeature()` method
  - All output formats now work correctly through Builder interface
  - GeoJsonBuilder now properly handles bbox in FeatureCollections

- **Code Quality**
  - Fixed ESLint warning: replaced `while(true)` with `for(;;)` in streaming parser
  - Removed unused Geometry import from type definitions

---

## 📊 Test Coverage

```
Test Suites: 14 passed, 14 total
Tests:       414 passed, 414 total ✓
```

**New Tests:**
- 18 Builder Integration tests
- **Total increase:** +18 tests

**Test Distribution:**
- GeoJSON Builder Integration: 2 tests
- CSV Builder Integration: 1 test
- KML Builder Integration: 1 test
- WKT Builder Integration: 1 test
- CIS JSON Builder Integration: 3 tests
- CoverageJSON Builder Integration: 3 tests
- Shapefile Builder Integration: 4 tests
- getBuilder() Edge Cases: 2 tests
- Mixed Content Tests: 1 test

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

All existing functionality remains unchanged. The new Shapefile builder and CLI multi-format support extend the library's capabilities without affecting existing code.

---

## 📝 Commit Summary

This release includes commits since v1.5.0:

1. **530c47b** - feat: add Shapefile builder with ZIP export support
2. **6d42145** - fix: improve builder architecture and code quality
3. **3ea7163** - feat: add multi-format support to CLI parse command
4. **dc78f3d** - test: add comprehensive builder integration tests
5. **88fcbb3** - chore: add OCI labels to Dockerfile for GitHub Container Registry
6. **8d68e33** - chore: add automated version bump script
7. **fe88965** - docs: add Shapefile and CLI multi-format documentation
8. **11525eb** - chore: release v1.6.0

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.5.0.

### Shapefile Export

**Generate Shapefile ZIP:**
```typescript
import { ShapefileBuilder, GmlParser } from '@npm9912/s-gml';

// Method 1: Using getBuilder()
const parser = new GmlParser(getBuilder('shapefile'));
const geojson = await parser.parse(gmlData);

// Method 2: Using ShapefileBuilder directly
const builder = new ShapefileBuilder();
const parser2 = new GmlParser(builder);
const geojson2 = await parser2.parse(gmlData);

// Export to ZIP
const zipBuffer = await builder.toZip(geojson, {
    outputType: 'nodebuffer',
    filename: 'my-shapefile',
});

// Save to file (Node.js)
import { writeFileSync } from 'fs';
writeFileSync('output.zip', Buffer.from(zipBuffer));
```

### CLI Multi-Format

**Use different output formats:**
```bash
# Parse to different formats
s-gml parse input.gml --format geojson > output.geojson
s-gml parse input.gml --format csv > output.csv
s-gml parse input.gml --format kml > output.kml
s-gml parse input.gml --format wkt > output.json
s-gml parse input.gml --format shapefile --output output.zip
s-gml parse coverage.gml --format cis-json > coverage.json
s-gml parse coverage.gml --format coveragejson > coverage.covjson

# Using format aliases
s-gml parse input.gml --format shp --output output.zip
s-gml parse coverage.gml --format json-coverage > coverage.json
s-gml parse coverage.gml --format covjson > coverage.covjson
```

### Version Bump Automation

**Update version across all files:**
```bash
# Bump to new version
npm run version:bump 1.7.0

# This automatically updates:
# - package.json "version"
# - Dockerfile LABEL org.opencontainers.image.version
# - src/cli.ts .version()
# - CHANGELOG.md (adds new section with template)

# After bumping, complete the CHANGELOG and commit
git add .
git commit -m "chore: release v1.7.0"
git tag -a v1.7.0 -m "Release v1.7.0"
git push && git push --tags
```

---

## 🧪 Testing

All 414 tests pass successfully:

```bash
pnpm test
# Test Suites: 14 passed, 14 total
# Tests:       414 passed, 414 total
```

New test coverage:
- ✅ Shapefile ZIP export (Node.js and browser)
- ✅ All 7 output formats via getBuilder()
- ✅ Format aliases (shp, json-coverage, covjson)
- ✅ Mixed geometry types in FeatureCollections
- ✅ CSV special character escaping
- ✅ KML XML escaping
- ✅ WKT geometry conversion
- ✅ Binary Shapefile output handling

---

## 📦 Installation

### npm
```bash
npm install @npm9912/s-gml@1.6.0
```

### pnpm
```bash
pnpm add @npm9912/s-gml@1.6.0
```

### yarn
```bash
yarn add @npm9912/s-gml@1.6.0
```

## 🐳 Docker

```bash
# Pull image
docker pull ghcr.io/pt9912/s-gml:1.6.0
docker pull ghcr.io/pt9912/s-gml:latest

# Run CLI
docker run --rm -v $(pwd)/data:/data ghcr.io/pt9912/s-gml:1.6.0 \
  parse /data/input.gml --format geojson --output /data/output.geojson

# Run with different formats
docker run --rm -v $(pwd)/data:/data ghcr.io/pt9912/s-gml:1.6.0 \
  parse /data/input.gml --format shapefile --output /data/output.zip
```

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure comprehensive multi-format support and robust Shapefile generation capabilities.

**Features Implemented:**
- Shapefile builder with ZIP export (Node.js & browser)
- CLI multi-format support (7 formats with aliases)
- Comprehensive builder integration tests
- Automated version management tooling
- Docker OCI compliance

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **GitHub Release:** [v1.6.0](https://github.com/pt9912/s-gml/releases/tag/v1.6.0)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)
- **Docker:** [ghcr.io/pt9912/s-gml](https://github.com/pt9912/s-gml/pkgs/container/s-gml)
- **Shapefile Format:** [ESRI Shapefile Technical Description](https://www.esri.com/content/dam/esrisites/sitecore-archive/Files/Pdfs/library/whitepapers/pdfs/shapefile.pdf)

---

## 🔜 What's Next

Future improvements may include:
- Additional output formats (GeoPackage, FlatGeobuf)
- Streaming parser for very large files
- Performance optimizations for large datasets
- GML validation improvements
- Time-series Coverage support

---

**Full Changelog:** [v1.5.0...v1.6.0](https://github.com/pt9912/s-gml/compare/v1.5.0...v1.6.0)
