# Release Notes - v1.7.0

**Release Date:** 2025-10-17

## 🎉 Overview

This release adds **GeoPackage and FlatGeobuf export support**, **comprehensive unit tests for all coverage builders**, and **improved Jest testing infrastructure** for ESM modules. s-gml now provides complete coverage of modern geospatial binary formats alongside extensive test coverage ensuring reliability and quality.

---

## ✨ Highlights

### 📦 GeoPackage Builder with Export Support

**Full support for generating OGC GeoPackage (.gpkg) files from GML data:**

```typescript
import { GeoPackageBuilder, GmlParser } from '@npm9912/s-gml';

const builder = new GeoPackageBuilder();
const parser = new GmlParser(builder);
const geojson = await parser.parse(gmlData);

// Export as GeoPackage with custom table name
const gpkgBuffer = await builder.toGeoPackage(geojson, {
    tableName: 'my_features'
});

// Save to file (Node.js)
import { writeFileSync } from 'fs';
writeFileSync('output.gpkg', gpkgBuffer);
```

**Features:**
- SQLite-based geospatial database format
- Support for custom table names via options
- Based on `@ngageoint/geopackage` library
- 18 comprehensive tests for GeoPackage generation
- CLI support: `--format geopackage` or `--format gpkg`

### 🚀 FlatGeobuf Builder with Binary Export

**Performance-optimized binary format with spatial indexing:**

```typescript
import { FlatGeobufBuilder, GmlParser } from '@npm9912/s-gml';

const builder = new FlatGeobufBuilder();
const parser = new GmlParser(builder);
const geojson = await parser.parse(gmlData);

// Export as FlatGeobuf binary
const fgbBinary = builder.toFlatGeobuf(geojson);

// Save to file (Node.js)
import { writeFileSync } from 'fs';
writeFileSync('output.fgb', fgbBinary);
```

**Features:**
- Performance-optimized binary geospatial format
- Built-in spatial indexing for fast queries
- Based on `flatgeobuf` library
- Magic bytes validation (0x66, 0x67, 0x62)
- 19 comprehensive tests including performance benchmarks
- CLI support: `--format flatgeobuf` or `--format fgb`

### 🧪 Comprehensive Coverage Builder Unit Tests

**Complete test coverage for all coverage format builders:**

**CIS-JSON Builder (24 tests):**
- All geometry types (Point, LineString, Polygon, Multi*)
- All coverage types (RectifiedGrid, Grid, ReferenceableGrid, MultiPoint)
- Envelope and Box handling
- Curve and Surface transformations
- Feature and FeatureCollection support
- Builder integration with GmlParser
- Error handling for unsupported geometry types

**CoverageJSON Builder (24 tests):**
- All geometry types with GeoJSON-like output
- All coverage types with web-optimized structure
- CRS referencing and domain handling
- Coverage-specific features (with/without file references)
- Parameters and ranges building
- Grid axes and temporal support
- Builder integration with GmlParser

### 🛠️ Jest ESM Mock Infrastructure

**Robust testing infrastructure for ESM-only dependencies:**

```typescript
// test/setup.ts - Global Jest setup
jest.mock('flatgeobuf/lib/mjs/geojson.js', () => ({
    serialize: jest.fn(() => new Uint8Array([...])),
}));

jest.mock('@ngageoint/geopackage', () => ({
    GeoPackageAPI: {
        create: jest.fn(async () => ({ /* mock */ })),
    },
}));
```

**Features:**
- Global Jest setup file for centralized mocking
- Mock implementations for flatgeobuf and @ngageoint/geopackage
- Proper handling of ESM-only dependencies
- Improved test reliability and maintainability
- Extended `.eslintignore` for mock files

---

## 🔧 Detailed Changes

### Added

- **GeoPackage Builder with Export Support**
  - New `GeoPackageBuilder` class using @ngageoint/geopackage
  - `toGeoPackage()` method for generating OGC GeoPackage (.gpkg) files
  - Support for custom table names via options
  - SQLite-based geospatial database format
  - 18 comprehensive tests for GeoPackage generation
  - CLI support with `--format geopackage` or `--format gpkg`

- **FlatGeobuf Builder with Binary Export**
  - New `FlatGeobufBuilder` class using flatgeobuf library
  - `toFlatGeobuf()` method for generating FlatGeobuf (.fgb) binary files
  - Performance-optimized binary geospatial format with spatial indexing
  - Magic bytes validation in tests
  - 19 comprehensive tests including performance benchmarks
  - CLI support with `--format flatgeobuf` or `--format fgb`

- **Comprehensive Unit Tests for Coverage Builders**
  - 24 unit tests for `CisJsonBuilder` covering all geometry types and coverage types
  - 24 unit tests for `CoverageJsonBuilder` with CRS referencing tests
  - Tests for RectifiedGridCoverage, GridCoverage, ReferenceableGridCoverage, MultiPointCoverage
  - Builder integration tests with GmlParser
  - Error handling tests for unsupported geometry types
  - Coverage-specific feature tests (with/without file references)

- **Jest ESM Mock Infrastructure**
  - Global Jest setup file (`test/setup.ts`) for ESM module mocking
  - Mock implementations for flatgeobuf and @ngageoint/geopackage libraries
  - Proper handling of ESM-only dependencies in test environment
  - Total test count: **499 tests** (up from 414)

### Changed

- **Jest Configuration**
  - Added `setupFilesAfterEnv` pointing to `test/setup.ts`
  - Global mocks for flatgeobuf and @ngageoint/geopackage ESM modules
  - Improved test reliability with centralized mocking

- **ESLint Configuration**
  - Extended `.eslintignore` to exclude `test/__mocks__/` directory
  - Cleaner lint output without mock-related warnings

- **README.md**
  - Added GeoPackage builder documentation with usage examples
  - Added FlatGeobuf builder documentation with usage examples
  - Updated builder table to include GeoPackage and FlatGeobuf
  - Updated CLI format options to include gpkg and fgb aliases

---

## 📊 Test Coverage

```
Test Suites: 27 passed, 27 total
Tests:       499 passed, 499 total ✓
```

**Coverage Metrics:**
- Overall statement coverage: 78.15%
- CisJsonBuilder coverage: 82.85%
- CoverageJsonBuilder coverage: 84.94%
- GeoPackageBuilder coverage: 48.38% (mocked external library)
- FlatGeobufBuilder coverage: 40.74% (mocked external library)

**New Tests:**
- 18 GeoPackage Builder tests
- 19 FlatGeobuf Builder tests
- 24 CIS-JSON Builder unit tests
- 24 CoverageJSON Builder unit tests
- **Total increase:** +85 tests (414 → 499)

**Test Distribution:**
- Basic functionality tests
- All geometry types (Point, LineString, Polygon, Multi*)
- All coverage types (RectifiedGrid, Grid, ReferenceableGrid, MultiPoint)
- Properties handling (null, complex, long names)
- Builder integration with GmlParser
- Helper function tests
- Empty collections handling
- Feature IDs preservation
- Performance benchmarks (FlatGeobuf)

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

All existing functionality remains unchanged. The new GeoPackage and FlatGeobuf builders extend the library's capabilities without affecting existing code.

---

## 📝 Commit Summary

This release includes the following commit:

1. **b44b20b** - chore: release v1.7.0
   - Add GeoPackage and FlatGeobuf builders with comprehensive tests
   - Add unit tests for CIS-JSON and CoverageJSON builders
   - Configure Jest for ESM module mocking
   - Update documentation and dependencies

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.6.0.

### GeoPackage Export

**Generate GeoPackage files:**
```typescript
import { GeoPackageBuilder, GmlParser } from '@npm9912/s-gml';

// Method 1: Using getBuilder()
const parser = new GmlParser(getBuilder('geopackage'));
const geojson = await parser.parse(gmlData);

// Method 2: Using GeoPackageBuilder directly
const builder = new GeoPackageBuilder();
const parser2 = new GmlParser(builder);
const geojson2 = await parser2.parse(gmlData);

// Export to GeoPackage
const gpkgBuffer = await builder.toGeoPackage(geojson, {
    tableName: 'my_features',
});

// Save to file (Node.js)
import { writeFileSync } from 'fs';
writeFileSync('output.gpkg', gpkgBuffer);
```

### FlatGeobuf Export

**Generate FlatGeobuf binary files:**
```typescript
import { FlatGeobufBuilder, GmlParser } from '@npm9912/s-gml';

// Using FlatGeobufBuilder directly
const builder = new FlatGeobufBuilder();
const parser = new GmlParser(builder);
const geojson = await parser.parse(gmlData);

// Export to FlatGeobuf
const fgbBinary = builder.toFlatGeobuf(geojson);

// Save to file (Node.js)
import { writeFileSync } from 'fs';
writeFileSync('output.fgb', fgbBinary);
```

### CLI Usage

**Use the new output formats:**
```bash
# GeoPackage
s-gml parse input.gml --format geopackage --output output.gpkg
s-gml parse input.gml --format gpkg --output output.gpkg

# FlatGeobuf
s-gml parse input.gml --format flatgeobuf --output output.fgb
s-gml parse input.gml --format fgb --output output.fgb

# All supported formats (9 total)
s-gml parse input.gml --format geojson > output.geojson
s-gml parse input.gml --format shapefile --output output.zip
s-gml parse input.gml --format csv > output.csv
s-gml parse input.gml --format kml > output.kml
s-gml parse input.gml --format wkt > output.json
s-gml parse input.gml --format geopackage --output output.gpkg
s-gml parse input.gml --format flatgeobuf --output output.fgb
s-gml parse coverage.gml --format cis-json > coverage.json
s-gml parse coverage.gml --format coveragejson > coverage.covjson
```

---

## 🧪 Testing

All 499 tests pass successfully:

```bash
pnpm test
# Test Suites: 27 passed, 27 total
# Tests:       499 passed, 499 total
```

New test coverage includes:
- ✅ GeoPackage export with custom table names
- ✅ FlatGeobuf binary generation with magic bytes validation
- ✅ All CIS-JSON builder geometry and coverage types
- ✅ All CoverageJSON builder with CRS referencing
- ✅ ESM module mocking infrastructure
- ✅ Error handling for unsupported geometry types
- ✅ Performance benchmarks for large feature collections
- ✅ Property handling (null, complex objects, arrays)

---

## 📦 Installation

### npm
```bash
npm install @npm9912/s-gml@1.7.0
```

### pnpm
```bash
pnpm add @npm9912/s-gml@1.7.0
```

### yarn
```bash
yarn add @npm9912/s-gml@1.7.0
```

## 🐳 Docker

```bash
# Pull image
docker pull ghcr.io/pt9912/s-gml:1.7.0
docker pull ghcr.io/pt9912/s-gml:latest

# Run CLI with GeoPackage output
docker run --rm -v $(pwd)/data:/data ghcr.io/pt9912/s-gml:1.7.0 \
  parse /data/input.gml --format geopackage --output /data/output.gpkg

# Run CLI with FlatGeobuf output
docker run --rm -v $(pwd)/data:/data ghcr.io/pt9912/s-gml:1.7.0 \
  parse /data/input.gml --format flatgeobuf --output /data/output.fgb
```

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure comprehensive binary format support and robust test coverage for all builders.

**Features Implemented:**
- GeoPackage builder with SQLite-based output
- FlatGeobuf builder with performance-optimized binary format
- Complete unit test coverage for CIS-JSON and CoverageJSON builders
- Jest ESM mock infrastructure for reliable testing
- 85 new tests bringing total to 499

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **GitHub Release:** [v1.7.0](https://github.com/pt9912/s-gml/releases/tag/v1.7.0)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)
- **Docker:** [ghcr.io/pt9912/s-gml](https://github.com/pt9912/s-gml/pkgs/container/s-gml)
- **GeoPackage:** [OGC GeoPackage](https://www.geopackage.org/)
- **FlatGeobuf:** [FlatGeobuf Specification](https://github.com/flatgeobuf/flatgeobuf)

---

## 🔜 What's Next

Future improvements may include:
- Additional performance optimizations for very large datasets
- Enhanced streaming support for binary formats
- Further test coverage improvements
- Additional output format support

---

**Full Changelog:** [v1.6.0...v1.7.0](https://github.com/pt9912/s-gml/compare/v1.6.0...v1.7.0)
