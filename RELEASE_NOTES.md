# Release Notes - v1.5.0

**Release Date:** 2025-10-16

## 🎉 Overview

This release adds WCS 2.0 XML generation capabilities, enabling round-trip conversion between GML Coverage XML and JavaScript objects. The library now supports generating WCS-compliant XML from Coverage objects with full multi-band RangeType support, making s-gml a complete solution for both parsing and generating WCS Coverage data.

---

## ✨ Highlights

### 🏗️ WCS 2.0 XML Coverage Generator

**Generate WCS 2.0 compliant XML from Coverage objects:**
```typescript
import { CoverageGenerator } from '@npm9912/s-gml';

const coverage = {
  type: 'RectifiedGridCoverage',
  id: 'MY_COVERAGE',
  boundedBy: {
    type: 'Envelope',
    bbox: [5, 10, 15, 20],
    srsName: 'EPSG:4326',
    version: '3.2'
  },
  domainSet: {
    dimension: 2,
    srsName: 'EPSG:4326',
    limits: { low: [0, 0], high: [99, 199] },
    axisLabels: ['Lat', 'Long'],
    origin: [15.0, 5.0],
    offsetVectors: [[0, 0.2], [-0.2, 0]]
  },
  rangeSet: {
    file: { fileName: 'coverage_data.tif', fileStructure: 'GeoTIFF' }
  },
  version: '3.2'
};

const generator = new CoverageGenerator();
const xml = generator.generate(coverage);
// <gml:RectifiedGridCoverage ...>...</gml:RectifiedGridCoverage>

// Pretty-printed XML
const xmlPretty = generator.generate(coverage, true);
```

**Supported Coverage Types:**
- ✅ **RectifiedGridCoverage** - Georeferenced grid with affine transformation
- ✅ **GridCoverage** - Non-georeferenced grid
- ✅ **ReferenceableGridCoverage** - Irregular georeferencing
- ✅ **MultiPointCoverage** - Arbitrarily distributed points

### 🎨 Multi-band RangeType Support

**Full support for multi-band coverages with RGB, hyperspectral, and multi-parameter data:**
```typescript
const rgbCoverage = {
  type: 'RectifiedGridCoverage',
  domainSet: {
    dimension: 2,
    limits: { low: [0, 0], high: [100, 100] },
    origin: [0, 0],
    offsetVectors: [[1, 0], [0, 1]]
  },
  rangeSet: { file: { fileName: 'rgb.tif' } },
  // Multi-band RangeType with SWE DataRecord
  rangeType: {
    field: [
      { name: 'red', dataType: 'uint8', uom: 'W.m-2.sr-1', description: 'Red band (620-750 nm)' },
      { name: 'green', dataType: 'uint8', uom: 'W.m-2.sr-1', description: 'Green band (495-570 nm)' },
      { name: 'blue', dataType: 'uint8', uom: 'W.m-2.sr-1', description: 'Blue band (450-495 nm)' }
    ]
  },
  version: '3.2'
};

const xml = generateCoverageXml(rgbCoverage);
// Generates WCS 2.0 XML with SWE DataRecord containing 3 bands
```

### 🔄 Round-Trip Conversion

**Seamless conversion: GML XML → Object → GML XML:**
```typescript
// Parse GML to object
const parser = new GmlParser();
const coverage = await parser.parse(originalXml);

// Generate XML from object
const generator = new CoverageGenerator();
const regeneratedXml = generator.generate(coverageObject);

// Parse again to verify
const reparsed = await parser.parse(regeneratedXml);
// All properties match original!
```

**Total: 247 tests** (up from 233)

---

## 🔧 Detailed Changes

### Added

- **Coverage Generator** (`src/generators/coverage-generator.ts`)
  - `CoverageGenerator` class for WCS 2.0 XML generation
  - `generate(coverage, prettyPrint)` - Generate XML from any Coverage type
  - `generateRectifiedGridCoverage()` - RectifiedGridCoverage XML
  - `generateGridCoverage()` - GridCoverage XML
  - `generateReferenceableGridCoverage()` - ReferenceableGridCoverage XML
  - `generateMultiPointCoverage()` - MultiPointCoverage XML
  - Helper function `generateCoverageXml()`
  - 10 comprehensive tests for Coverage Generator

- **Multi-band RangeType Tests** (`test/coverage.test.ts`)
  - RGB Coverage test (3 bands: red, green, blue)
  - Landsat-8 hyperspectral test (7 bands: coastal_aerosol through swir2)
  - Weather station multi-parameter test (4 parameters: temperature, humidity, pressure, wind_speed)
  - GeoTIFF metadata extraction from multi-band coverage
  - 4 comprehensive tests validating existing multi-band support

### Changed

- **README.md**
  - Added "Coverage zu WCS 2.0 XML generieren" section with examples
  - Added `CoverageGenerator` to features table
  - Added `CoverageGenerator` API documentation
  - Included multi-band RangeType example with RGB data
  - Added round-trip conversion example

- **CHANGELOG.md**
  - Added v1.5.0 section with all new features
  - Updated version comparison links

- **Exports** (`src/index.ts`)
  - Exported `CoverageGenerator` class
  - Exported `generateCoverageXml` helper function

### Examples

**Basic Coverage Generation:**
```typescript
import { CoverageGenerator } from '@npm9912/s-gml';

const generator = new CoverageGenerator();
const xml = generator.generate(coverage);
```

**Multi-band RGB:**
```typescript
const rgbCoverage = {
  type: 'RectifiedGridCoverage',
  rangeType: {
    field: [
      { name: 'red', dataType: 'uint8' },
      { name: 'green', dataType: 'uint8' },
      { name: 'blue', dataType: 'uint8' }
    ]
  },
  // ...
};
const xml = generateCoverageXml(rgbCoverage, true); // pretty-print
```

**Hyperspectral Data:**
```typescript
// Landsat-8 with 7 spectral bands
const landsatCoverage = {
  type: 'GridCoverage',
  rangeType: {
    field: [
      { name: 'coastal_aerosol', dataType: 'uint16', uom: 'W/(m2.sr.μm)' },
      { name: 'blue', dataType: 'uint16', uom: 'W/(m2.sr.μm)' },
      // ... 5 more bands
    ]
  },
  // ...
};
```

---

## 📊 Test Coverage

```
Test Suites: 14 passed, 14 total
Tests:       247 passed, 247 total ✓
```

**New Tests:**
- 10 Coverage Generator tests
- 4 Multi-band RangeType tests
- **Total increase:** +14 tests

**Test Distribution:**
- Coverage Generator: 10 tests
  - XML generation for all 4 coverage types
  - Multi-band RangeType generation
  - Round-trip conversion
  - Pretty-print formatting
  - XML escaping
- Multi-band RangeType: 4 tests
  - RGB Coverage (3 bands)
  - Landsat-8 hyperspectral (7 bands)
  - Weather station multi-parameter (4 parameters)
  - GeoTIFF metadata from multi-band

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

All existing functionality remains unchanged. The new Coverage Generator extends the library's capabilities without affecting existing code.

---

## 📝 Commit Summary

This release includes commits since v1.4.0:

1. **c55d7be** - feat: add WCS 2.0 XML Coverage Generator with round-trip support
2. **995b78b** - docs: add Coverage Generator documentation to README
3. **02a463c** - test: add comprehensive multi-band RangeType tests

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.4.0.

### WCS 2.0 XML Generation

**Generate Coverage XML:**
```typescript
import { CoverageGenerator, generateCoverageXml } from '@npm9912/s-gml';

// Method 1: Using the class
const generator = new CoverageGenerator();
const xml = generator.generate(coverage);

// Method 2: Using the helper function
const xml = generateCoverageXml(coverage);

// Pretty-printed XML
const xmlPretty = generateCoverageXml(coverage, true);
```

### Multi-band Coverages

**Create multi-band coverage:**
```typescript
const coverage = {
  type: 'RectifiedGridCoverage',
  domainSet: { /* grid definition */ },
  rangeSet: { file: { fileName: 'data.tif' } },
  rangeType: {
    field: [
      { name: 'band1', dataType: 'uint16', uom: 'W.m-2.sr-1', description: 'Near-infrared' },
      { name: 'band2', dataType: 'uint16', uom: 'W.m-2.sr-1', description: 'Red' },
      { name: 'band3', dataType: 'uint16', uom: 'W.m-2.sr-1', description: 'Green' }
    ]
  },
  version: '3.2'
};

const xml = generateCoverageXml(coverage);
```

### Round-Trip Workflow

**Parse → Modify → Generate:**
```typescript
// 1. Parse existing GML
const parser = new GmlParser();
const coverage = await parser.parse(gmlXml);

// 2. Extract coverage object (from GeoJSON properties or internal representation)
const coverageObj = /* extract from parsed result */;

// 3. Modify if needed
coverageObj.rangeType = {
  field: [
    { name: 'red', dataType: 'uint8' },
    { name: 'green', dataType: 'uint8' },
    { name: 'blue', dataType: 'uint8' }
  ]
};

// 4. Generate new XML
const newXml = generateCoverageXml(coverageObj);
```

---

## 🧪 Testing

All 247 tests pass successfully:

```bash
pnpm test
# Test Suites: 14 passed, 14 total
# Tests:       247 passed, 247 total
```

New test coverage:
- ✅ WCS 2.0 XML generation for all coverage types
- ✅ Multi-band RangeType with SWE DataRecord
- ✅ RGB Coverage (3 bands)
- ✅ Landsat-8 hyperspectral (7 bands)
- ✅ Weather station multi-parameter (4 parameters)
- ✅ Round-trip conversion (GML → Object → GML)
- ✅ Pretty-print XML formatting
- ✅ XML escaping for safe output
- ✅ GeoTIFF metadata from multi-band coverage

---

## 📦 Installation

```bash
npm install @npm9912/s-gml@1.5.0
```

## 🐳 Docker

```bash
docker build -t s-gml-cli .
docker run --rm -v $(pwd)/test/gml:/data s-gml-cli parse /data/coverage.xml --output /data/output.geojson
```

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure comprehensive WCS 2.0 XML generation support and full multi-band coverage capabilities.

**Features Implemented:**
- WCS 2.0 compliant XML generation
- Multi-band RangeType support (RGB, hyperspectral, multi-parameter)
- Round-trip conversion (GML ↔ Object)
- Pretty-print XML formatting
- Comprehensive test coverage

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)
- **OGC WCS 2.0:** [OGC 09-110r4](https://portal.ogc.org/files/?artifact_id=41437)
- **OGC CIS JSON:** [OGC 09-146r8](https://docs.ogc.org/is/09-146r8/09-146r8.html)
- **CoverageJSON:** [OGC 21-069r2](https://docs.ogc.org/cs/21-069r2/21-069r2.html)

---

## 🔜 What's Next

Future improvements may include:
- Time-series Coverage support (temporal domain axis)
- WCS GetCoverage request builder
- Streaming parser for very large coverage files
- Performance optimizations for large coverage datasets
- Additional output builders (CSV, KML, Shapefile)

---

**Full Changelog:** [v1.4.0...v1.5.0](https://github.com/pt9912/s-gml/compare/v1.4.0...v1.5.0)
