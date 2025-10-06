# Release Notes - v1.2.0

**Release Date:** 2025-10-06

## 🎉 Overview

This release significantly enhances WFS (Web Feature Service) support with comprehensive integration tests covering WFS 1.0, 1.1, and 2.0. Improved GML version detection, better feature parsing, and support for various WFS-specific elements ensure robust handling of real-world WFS responses.

---

## ✨ Highlights

### 🗺️ WFS Integration Tests

**28 new comprehensive tests:**
- **WFS 2.0 with GML 3.2** - 7 tests for `wfs:member` parsing
- **WFS 1.1 with GML 3.0** - 5 tests for `gml:featureMembers` handling
- **WFS 1.0 with GML 2.1.2** - 9 tests for legacy coordinate format
- **Version comparison** - 4 tests ensuring consistency across WFS versions
- **Real-world data integrity** - 3 tests with OpenStreetMap water_areas features

**Real-world WFS Sample Files:**
- `wfs-gml32-1-f.xml` - WFS 2.0 response with GML 3.2
- `wfs-gml3-1-f.xml` - WFS 1.1 response with GML 3.0
- `wfs-3-f.xml` - WFS 1.0 response with GML 2.1.2

### 🔍 Enhanced GML Version Detection

**Content-based Detection:**
- Intelligently detects GML 2.1.2 vs 3.x for unversioned namespace
- Checks for GML 2.1.2 specific elements (`gml:coordinates`, `outerBoundaryIs`, `innerBoundaryIs`)
- Defaults to GML 3.2 for modern WFS services using unversioned namespace
- **Total: 203 tests** (up from 175)

---

## 🔧 Detailed Changes

### Added

- **WFS Integration Test Suite** (`test/wfs-integration.test.ts`)
  - 28 comprehensive tests covering WFS 1.0, 1.1, and 2.0
  - Tests for all WFS member element types
  - Real-world OpenStreetMap water_areas feature testing
  - Coordinate validation and geometry integrity checks

- **WFS 2.0 Support**
  - `wfs:member` element parsing
  - Proper handling of WFS 2.0 FeatureCollection structure

- **GML 2.1.2 Feature ID Support**
  - `fid` attribute support alongside `gml:id`
  - Proper feature identification in WFS 1.0 responses

- **Content-based GML Version Detection**
  - `hasGml212Elements()` function for detecting GML 2.1.2 features
  - Fallback detection for unversioned GML namespace

### Changed

- **Improved GML Version Detection** (`src/utils.ts`)
  - Added content-based detection for `http://www.opengis.net/gml` namespace
  - Checks for GML 2.1.2 specific elements before defaulting to 3.2
  - More accurate version detection for legacy WFS services

- **Enhanced Feature Parsing** (`src/parser.ts`)
  - Support for both `gml:featureMember` and `wfs:member` elements
  - Improved `gml:featureMembers` array handling
  - Better handling of WFS 1.1 feature collections

### Fixed

- WFS 2.0 feature extraction from `wfs:member` elements
- WFS 1.1 array handling in `gml:featureMembers` containers
- GML version detection for unversioned namespace
- MultiPoint and MultiLineString validation for empty member elements

---

## 📊 Test Coverage

```
Test Suites: 11 passed, 11 total
Tests:       203 passed, 203 total
```

**New Test Files:**
- `test/wfs-integration.test.ts` - 28 WFS integration tests

**Sample Files:**
- `test/gml/wfs-gml32-1-f.xml` - WFS 2.0 with GML 3.2 (1 feature)
- `test/gml/wfs-gml3-1-f.xml` - WFS 1.1 with GML 3.0 (1 feature)
- `test/gml/wfs-3-f.xml` - WFS 1.0 with GML 2.1.2 (30 features)

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

---

## 📝 Commit Summary

This release includes 3 commits since v1.1.4:

1. **fa6e664** - feat: add WFS integration tests and improve WFS parsing
2. **c995952** - feat: add WFS 1.0 / GML 2.1.2 integration tests
3. **7dcbc73** - fix: improve validation for empty MultiPoint and MultiLineString

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.1.4.

### WFS Parsing Improvements

The parser now automatically handles:

**WFS 2.0 (`wfs:member`):**
```typescript
import { GmlParser } from '@npm9912/s-gml';

const parser = new GmlParser();
const result = await parser.parse(wfs20Xml);
// Correctly extracts features from wfs:member elements
```

**WFS 1.0 (`fid` attributes):**
```typescript
// Feature IDs now correctly extracted from fid attribute
const feature = result.features[0];
console.log(feature.id); // "water_areas.230"
```

**Automatic Version Detection:**
```typescript
// GML version now auto-detected for unversioned namespace
// Checks for GML 2.1.2 elements, defaults to 3.2
const result = await parser.parse(wfsXml);
console.log(result.version); // "2.1.2" or "3.2"
```

---

## 🧪 Testing

All 203 tests pass successfully:

```bash
pnpm test
# Test Suites: 11 passed, 11 total
# Tests:       203 passed, 203 total
```

WFS integration verified:
- ✅ WFS 2.0 with `wfs:member` elements
- ✅ WFS 1.1 with `gml:featureMembers` arrays
- ✅ WFS 1.0 with GML 2.1.2 coordinates
- ✅ Feature ID extraction from `fid` attribute
- ✅ Content-based GML version detection

---

## 📦 Installation

```bash
npm install @npm9912/s-gml@1.2.0
```

## 🐳 Docker

```bash
docker build -t s-gml-cli .
docker run --rm -v $(pwd)/test/gml:/data s-gml-cli parse /data/wfs-3-f.xml --output /data/output.geojson
```

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure comprehensive WFS compatibility and robust real-world data handling.

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)

---

## 🔜 What's Next

Future improvements may include:
- Additional WFS 2.0 response format support
- Performance optimizations for large FeatureCollections
- Enhanced CRS transformation support
- OGC API - Features compatibility

---

**Full Changelog:** [v1.1.4...v1.2.0](https://github.com/pt9912/s-gml/compare/v1.1.4...v1.2.0)
