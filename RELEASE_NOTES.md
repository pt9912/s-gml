# Release Notes - v1.4.0

**Release Date:** 2025-10-16

## 🎉 Overview

This release adds comprehensive Web Coverage Service (WCS) support to s-gml, enabling parsing and conversion of GML Coverage data in multiple industry-standard formats. The library now supports all major OGC coverage types with GeoJSON, CIS JSON, and CoverageJSON output formats, plus powerful GeoTIFF metadata extraction utilities.

---

## ✨ Highlights

### 📊 WCS Coverage Support

**Parse all major GML Coverage types:**
```typescript
const parser = new GmlParser();

// Parse RectifiedGridCoverage (georeferenced grid with affine transformation)
const coverage = await parser.parse(rectifiedGridGml);
// { type: 'Feature', properties: { coverageType: 'RectifiedGridCoverage', grid: {...} } }

// Parse MultiPointCoverage (arbitrarily distributed points)
const pointCoverage = await parser.parse(multiPointGml);
// { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: [...] } }
```

**Supported Coverage Types:**
- ✅ **RectifiedGridCoverage** - Georeferenced grid with affine transformation
- ✅ **GridCoverage** - Non-georeferenced grid
- ✅ **ReferenceableGridCoverage** - Irregular georeferencing
- ✅ **MultiPointCoverage** - Arbitrarily distributed points

### 🌐 JSON Coverage Output Formats

**Three powerful output formats for web and GIS applications:**

**1. GeoJSON (default) - Web mapping:**
```typescript
const parser = new GmlParser();
const geojson = await parser.parse(coverageGml);
// GeoJSON Feature with coverage metadata in properties
```

**2. CIS JSON (OGC 09-146r8) - Coverage Implementation Schema:**
```typescript
const cisParser = new GmlParser('cis-json');
const cisJson = await cisParser.parse(coverageGml);
// { "@context": "http://www.opengis.net/cis/1.1/json", type: "CoverageByDomainAndRangeType", ... }
```

**3. CoverageJSON (OGC 21-069r2) - Web-optimized format:**
```typescript
const covjsonParser = new GmlParser('coveragejson');
const covJson = await covjsonParser.parse(coverageGml);
// { "type": "Coverage", "domain": {...}, "parameters": {...}, "ranges": {...} }
```

**Format Aliases:**
- `'cis-json'`, `'json-coverage'` → CIS JSON
- `'coveragejson'`, `'covjson'` → CoverageJSON

### 🗺️ GeoTIFF Metadata Utilities

**Extract GeoTIFF-compatible metadata and perform coordinate transformations:**
```typescript
import { extractGeoTiffMetadata, pixelToWorld, worldToPixel } from '@npm9912/s-gml';

// Extract GeoTIFF metadata from coverage
const metadata = extractGeoTiffMetadata(coverageObject);
// {
//   width: 100,
//   height: 200,
//   bbox: [1, 1, 10, 20],
//   crs: 'EPSG:4326',
//   transform: [0, 0.1, 10.0, -0.1, 0, 1.0],
//   resolution: [0.1, 0.1],
//   origin: [10.0, 1.0]
// }

// Convert pixel coordinates to world coordinates
const worldCoords = pixelToWorld(50, 100, metadata);
// [20.0, -4.0]

// Convert world coordinates back to pixel coordinates
const pixelCoords = worldToPixel(20.0, -4.0, metadata);
// [50, 100]
```

**Features:**
- ✅ Affine transformation matrix calculation
- ✅ Pixel resolution and rotation extraction
- ✅ Bidirectional coordinate transformation
- ✅ Band/channel metadata extraction

**Total: 233 tests** (up from 212)

---

## 🔧 Detailed Changes

### Added

- **WCS Coverage Types** (`src/parser.ts`, `src/types.ts`)
  - `parseRectifiedGridCoverage()` - Georeferenced grid with offsetVectors
  - `parseGridCoverage()` - Non-georeferenced grid
  - `parseReferenceableGridCoverage()` - Irregular georeferencing
  - `parseMultiPointCoverage()` - Point-based coverage
  - 3 comprehensive tests for Coverage parsing

- **CIS JSON Builder** (`src/builders/cis-json.ts`)
  - OGC 09-146r8 Coverage Implementation Schema JSON format
  - Full support for all 4 coverage types
  - Domain, Range, and RangeType serialization
  - 7 tests for CIS JSON output

- **CoverageJSON Builder** (`src/builders/coveragejson.ts`)
  - OGC 21-069r2 web-optimized coverage format
  - Grid domain with axes configuration
  - PointSeries domain for MultiPointCoverage
  - Parameters and Ranges with NdArray support
  - 8 tests for CoverageJSON output

- **GeoJSON Coverage Support** (`src/builders/geojson.ts`)
  - `buildRectifiedGridCoverage()` - Feature with grid metadata
  - `buildGridCoverage()` - Feature with non-georeferenced grid
  - `buildReferenceableGridCoverage()` - Feature with irregular grid
  - `buildMultiPointCoverage()` - Feature with MultiPoint geometry

- **GeoTIFF Metadata Utilities** (`src/utils/geotiff-metadata.ts`)
  - `extractGeoTiffMetadata()` - Extract metadata from Grid coverages
  - `pixelToWorld()` - Transform pixel to world coordinates
  - `worldToPixel()` - Transform world to pixel coordinates
  - Affine transformation matrix calculation [a, b, c, d, e, f]
  - Pixel resolution extraction with rotation support
  - 3 tests for GeoTIFF utilities

- **Type System** (`src/types.ts`)
  - `GmlRectifiedGridCoverage` interface
  - `GmlGridCoverage` interface
  - `GmlReferenceableGridCoverage` interface
  - `GmlMultiPointCoverage` interface
  - `GmlCoverage` union type
  - `GmlGridEnvelope`, `GmlRectifiedGrid`, `GmlGrid` types
  - `GmlRangeSet`, `GmlRangeType` types
  - Extended `Builder` interface with 4 coverage methods

- **Builder Factory** (`src/builders/index.ts`)
  - Updated `getBuilder()` with coverage format aliases
  - Support for `'cis-json'`, `'json-coverage'`, `'coveragejson'`, `'covjson'`

### Changed

- **README.md**
  - Main description: Added "WFS-/WCS-Unterstützung"
  - Removed deprecated "Neue GML-Elemente" feature row
  - Added "Coverage-Unterstützung" feature (4 coverage types)
  - Added "JSON-Coverage-Formate" feature (CIS JSON + CoverageJSON)
  - Added comprehensive Coverage parsing examples
  - Added GeoTIFF metadata extraction examples
  - Added JSON coverage format examples (3 formats)
  - Added MultiPointCoverage to supported elements table

- **Parser** (`src/parser.ts`)
  - Added coverage type detection in parseElement()
  - 4 new parse methods for coverage types
  - Extended type guards for coverage detection

- **Builders** (`src/builders/`)
  - Extended GeoJsonBuilder with 4 coverage build methods
  - New CisJsonBuilder for OGC CIS JSON output
  - New CoverageJsonBuilder for OGC CoverageJSON output

### Examples

**Coverage Parsing:**
```typescript
// Parse to GeoJSON
const parser = new GmlParser();
const coverage = await parser.parse(coverageGml);

// Parse to CIS JSON
const cisParser = new GmlParser('cis-json');
const cisJson = await cisParser.parse(coverageGml);

// Parse to CoverageJSON
const covjsonParser = new GmlParser('coveragejson');
const covJson = await covjsonParser.parse(coverageGml);
```

**GeoTIFF Metadata:**
```typescript
import { extractGeoTiffMetadata, pixelToWorld } from '@npm9912/s-gml';

const metadata = extractGeoTiffMetadata(coverageObject);
const worldCoords = pixelToWorld(50, 100, metadata);
```

---

## 📊 Test Coverage

```
Test Suites: 11 passed, 11 total
Tests:       233 passed, 233 total ✓
```

**New Tests:**
- 3 Coverage parsing tests (RectifiedGrid, MultiPoint)
- 7 CIS JSON builder tests
- 8 CoverageJSON builder tests
- 3 GeoTIFF metadata tests
- **Total increase:** +21 tests

**Test Distribution:**
- Coverage Parsing: 3 tests
- CIS JSON Builder: 7 tests
- CoverageJSON Builder: 8 tests
- GeoTIFF Utilities: 3 tests
- Existing tests: 212 tests (all passing)

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

All existing GML parsing functionality remains unchanged. The new coverage support extends the library's capabilities without affecting existing code.

---

## 📝 Commit Summary

This release includes commits since v1.3.0:

1. **18cf77f** - feat: add WCS Coverage support with 4 coverage types, CIS JSON/CoverageJSON builders, and GeoTIFF metadata utilities

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.3.0.

### WCS Coverage Parsing

**Parse GML Coverage to GeoJSON:**
```typescript
import { GmlParser } from '@npm9912/s-gml';

const parser = new GmlParser();
const geojson = await parser.parse(coverageGml);
// GeoJSON Feature with coverage metadata
```

**Parse to CIS JSON:**
```typescript
const cisParser = new GmlParser('cis-json');
const cisJson = await cisParser.parse(coverageGml);
// OGC CIS JSON format
```

**Parse to CoverageJSON:**
```typescript
const covjsonParser = new GmlParser('coveragejson');
const covJson = await covjsonParser.parse(coverageGml);
// OGC CoverageJSON format
```

### GeoTIFF Metadata Extraction

**Extract metadata from Grid coverages:**
```typescript
import { extractGeoTiffMetadata, pixelToWorld, worldToPixel } from '@npm9912/s-gml';

// First parse the coverage
const parser = new GmlParser();
const coverage = await parser.parse(coverageGml);

// Extract GeoTIFF metadata (only works with Grid-based coverages)
const metadata = extractGeoTiffMetadata(coverageObject);

// Transform coordinates
const worldCoords = pixelToWorld(50, 100, metadata);
const pixelCoords = worldToPixel(20.0, -4.0, metadata);
```

**Note:** GeoTIFF metadata extraction only works with Grid-based coverages (RectifiedGridCoverage, GridCoverage, ReferenceableGridCoverage). MultiPointCoverage is not supported for GeoTIFF metadata.

---

## 🧪 Testing

All 233 tests pass successfully:

```bash
pnpm test
# Test Suites: 11 passed, 11 total
# Tests:       233 passed, 233 total
```

New test coverage:
- ✅ RectifiedGridCoverage parsing to GeoJSON
- ✅ MultiPointCoverage parsing to all 3 formats
- ✅ CIS JSON builder for all coverage types
- ✅ CoverageJSON builder with Grid and PointSeries domains
- ✅ GeoTIFF metadata extraction
- ✅ Pixel-to-world coordinate transformation
- ✅ World-to-pixel coordinate transformation

---

## 📦 Installation

```bash
npm install @npm9912/s-gml@1.4.0
```

## 🐳 Docker

```bash
docker build -t s-gml-cli .
docker run --rm -v $(pwd)/test/gml:/data s-gml-cli parse /data/coverage.xml --output /data/output.geojson
```

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure comprehensive WCS compatibility and robust coverage data handling following OGC standards.

**OGC Standards Implemented:**
- OGC 09-146r8 - Coverage Implementation Schema (CIS) 1.1 JSON encoding
- OGC 21-069r2 - CoverageJSON Community Standard
- GML 3.2.1 - Coverage types and georeferencing

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)
- **OGC CIS JSON:** [OGC 09-146r8](https://docs.ogc.org/is/09-146r8/09-146r8.html)
- **CoverageJSON:** [OGC 21-069r2](https://docs.ogc.org/cs/21-069r2/21-069r2.html)

---

## 🔜 What's Next

Future improvements may include:
- Additional WCS response format support (WCS 2.0 XML)
- Performance optimizations for large coverage datasets
- Streaming parser for very large coverage files
- Support for time-series and multi-band coverages
- Enhanced CRS transformation for coverage grids
- WCS GetCoverage request builder

---

**Full Changelog:** [v1.3.0...v1.4.0](https://github.com/pt9912/s-gml/compare/v1.3.0...v1.4.0)
