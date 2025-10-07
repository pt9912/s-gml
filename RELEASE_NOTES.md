# Release Notes - v1.3.0

**Release Date:** 2025-10-06

## 🎉 Overview

This release adds powerful new capabilities for working with remote GML data and custom output formats. The parser now supports direct URL parsing for WFS requests, and developers can implement custom builders to convert GML into any format beyond GeoJSON.

---

## ✨ Highlights

### 🌐 URL Parsing Support

**Direct parsing from URLs:**
```typescript
const parser = new GmlParser();

// Parse WFS GetFeature request
const geojson = await parser.parseFromUrl(
  'https://example.com/wfs?service=WFS&request=GetFeature&typeName=water_areas'
);

// Convert GML from URL
const gml212 = await parser.convertFromUrl('https://example.com/data.gml', {
  outputVersion: '2.1.2',
  prettyPrint: true
});
```

**Features:**
- ✅ Automatic HTTP/HTTPS fetching with Fetch API
- ✅ Error handling for failed requests (404, 500, etc.)
- ✅ Works with WFS GetFeature requests
- ✅ Supports all parser methods (parse & convert)

### 🔧 Custom Builder Support

**Implement your own output formats:**
```typescript
class MyCustomBuilder implements Builder {
  buildPoint(gml: GmlPoint) {
    return {
      type: 'CustomPoint',
      x: gml.coordinates[0],
      y: gml.coordinates[1]
    };
  }
  // ... implement all 13 Builder methods
}

const parser = new GmlParser(new MyCustomBuilder());
const result = await parser.parse(gmlXml);
// Returns your custom format instead of GeoJSON!
```

**Use Cases:**
- Convert GML to proprietary formats
- Direct database object mapping
- Custom spatial data structures
- Legacy system integration

**Total: 212 tests** (up from 203)

---

## 🔧 Detailed Changes

### Added

- **URL Parsing Methods** (`src/parser.ts`)
  - `parseFromUrl(url: string)` - Fetch and parse GML from URLs
  - `convertFromUrl(url: string, options)` - Fetch and convert GML from URLs
  - `fetchXml(url)` private method with error handling
  - 6 comprehensive tests for URL methods

- **Custom Builder Support**
  - `GmlParser` constructor now accepts `Builder` objects directly
  - Constructor signature: `constructor(targetFormat: string | Builder = 'geojson')`
  - Full Builder interface exported from main module
  - 3 tests for custom builder functionality

- **Documentation**
  - Extensive Custom Builder section in README with complete example
  - URL parsing examples for both parse and convert methods
  - Builder interface documentation with all 13 required methods
  - Usage examples for WFS GetFeature requests

### Changed

- **GmlParser Constructor** (`src/parser.ts`)
  - Now accepts both string format names and Builder objects
  - Type signature: `string | Builder` with 'geojson' as default
  - Backwards compatible with existing code

- **README.md**
  - Added "GML von URL parsen" section
  - Added "GML Versionen konvertieren" section with URL example
  - Added "Custom Builder erstellen" section with full implementation
  - Updated API table with new methods

### Examples

**URL Parsing:**
```typescript
const geojson = await parser.parseFromUrl('https://example.com/wfs?...');
```

**Custom Builder:**
```typescript
const parser = new GmlParser(new MyCustomBuilder());
```

---

## 📊 Test Coverage

```
Test Suites: 11 passed, 11 total
Tests:       212 passed, 212 total ✓
```

**New Tests:**
- 6 URL parsing tests (`parseFromUrl`, `convertFromUrl`)
- 3 custom builder tests (constructor variants)
- **Total increase:** +9 tests

**Test Distribution:**
- URL Methods: 6 tests
- Custom Builder: 3 tests
- Existing tests: 203 tests (all passing)

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

The `GmlParser` constructor still accepts string format names ('geojson'), and additionally accepts Builder objects.

---

## 📝 Commit Summary

This release includes 3 commits since v1.2.0:

1. **64ccca9** - feat: add URL parsing support to GmlParser
2. **4f6c3c2** - chore: format README badges
3. **9bc94e5** - feat: add custom Builder support with documentation

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.2.0.

### URL Parsing

**Parse GML from remote URLs:**
```typescript
import { GmlParser } from '@npm9912/s-gml';

const parser = new GmlParser();
const geojson = await parser.parseFromUrl('https://example.com/wfs?service=WFS&request=GetFeature&typeName=water_areas');
```

### Custom Builder

**Implement custom output formats:**
```typescript
import { GmlParser, Builder } from '@npm9912/s-gml';

class MyBuilder implements Builder {
  buildPoint(gml) { return { type: 'MyPoint', x: gml.coordinates[0], y: gml.coordinates[1] }; }
  // ... implement all 13 Builder methods
}

const parser = new GmlParser(new MyBuilder());
const result = await parser.parse(gmlXml);
// Returns your custom format!
```

---

## 🧪 Testing

All 212 tests pass successfully:

```bash
pnpm test
# Test Suites: 11 passed, 11 total
# Tests:       212 passed, 212 total
```

New test coverage:
- ✅ URL parsing methods (6 tests)
- ✅ Custom builder support (3 tests)
- ✅ HTTP error handling
- ✅ WFS URL requests
- ✅ Custom output formats

---

## 📦 Installation

```bash
npm install @npm9912/s-gml@1.3.0
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
- Additional WFS response format support
- Performance optimizations for large FeatureCollections
- Enhanced CRS transformation support
- OGC API - Features compatibility
- Streaming parser for very large GML files

---

**Full Changelog:** [v1.2.0...v1.3.0](https://github.com/pt9912/s-gml/compare/v1.2.0...v1.3.0)
