# Release Notes - v1.1.2

**Release Date:** 2025-01-05

## 🎉 Overview

This release focuses on significantly improving code quality and test coverage. We've increased overall test coverage from 54% to 88%, adding 71 new comprehensive tests across all major components.

---

## ✨ Highlights

### 📊 Test Coverage Improvements

**Overall Coverage:**
- **Statements:** 54.87% → 88.53% (**+33.66%**)
- **Branch:** 45.35% → 77.18% (**+31.83%**)
- **Functions:** 67.16% → 90.29% (**+23.13%**)
- **Lines:** 57.62% → 90.82% (**+33.20%**)

**Component-Specific Improvements:**
- **parser.ts:** 51.05% → 88.7% (**+37.65%** lines)
- **generator.ts:** 46.9% → 98.96% (**+52.06%** lines)
- **geojson.ts:** 65.85% → 97.56% (**+31.71%** lines)
- **validator.ts:** 57.4% → 59.25% (**+1.85%** lines)

### 🧪 Test Suite Expansion

**New Tests Added:**
- **139 total tests** (up from 68)
- **+71 new test cases**
- **8 test suites**, all passing ✅

**Test Coverage Includes:**
- All GML geometry types (Point, LineString, Polygon, LinearRing, etc.)
- Multi-geometry types (MultiPoint, MultiLineString, MultiPolygon, MultiSurface)
- GML versions 2.1.2 and 3.2
- Feature and FeatureCollection parsing
- Error handling and edge cases
- CLI commands (parse, convert, validate)
- Property normalization and text extraction
- Coordinate parsing with various formats

### 🆕 New Test Files

- **test/geojson.test.ts** - Comprehensive GeoJSON builder tests
- Enhanced tests in parser.test.ts, generator.test.ts, validator.test.ts, cli.test.ts

---

## 🔧 Improvements

### Validator Enhancements

- Added XSD caching mechanism for better performance
- Introduced `__setXsdFetcher()` and `__clearXsdCache()` for testing
- Exported `__internal` methods for better testability
- Improved error handling with detailed error messages

### Parser Improvements

- Enhanced property normalization
- Better handling of nested objects and arrays
- Improved getText utility for complex value extraction
- More robust coordinate parsing

### Build & Configuration

- Updated Jest configuration for better coverage reporting
- Added JSON plugin for Rollup builds
- Improved Docker configuration with libxmljs rebuild
- Updated dependencies and build scripts

---

## 📝 Detailed Changes

### Test Coverage by Component

```
File           | % Stmts | % Branch | % Funcs | % Lines
---------------|---------|----------|---------|----------
All files      |   88.53 |    77.18 |   90.29 |   90.82
 src           |   88.11 |    76.55 |   88.88 |    90.5
  cli.ts       |   67.85 |    28.57 |      50 |   67.85
  generator.ts |   98.96 |       80 |   96.29 |   98.96
  index.ts     |     100 |      100 |   33.33 |     100
  parser.ts    |    88.7 |    82.65 |   95.45 |   92.34
  utils.ts     |   83.33 |     72.5 |     100 |   88.67
  validator.ts |   59.25 |    26.31 |      50 |   58.82
 src/builders  |   95.65 |    88.88 |     100 |   95.65
  geojson.ts   |   97.56 |    93.75 |     100 |   97.56
  index.ts     |      80 |       50 |     100 |      80
```

### New Test Cases

**Parser Tests:**
- GML 2.1.2 Point, LineString, Polygon with coordinates tag
- GML 3.2 with pos, posList elements
- Interior/exterior rings for Polygons
- Multi-geometry parsing (MultiPoint, MultiLineString, MultiPolygon)
- FeatureCollection with boundedBy envelope
- Feature properties with nested objects and arrays
- Edge cases: empty elements, null values, invalid inputs

**Generator Tests:**
- All geometry types in GML 3.2 and 2.1.2
- LineString with posList vs coordinates
- Polygon with interior rings
- Box, Envelope, Curve, Surface geometries
- Multi-geometries serialization
- Feature with various property types
- Error handling for unsupported types

**Validator Tests:**
- XSD caching mechanism
- Custom fetcher support
- Error wrapping and handling
- Internal loadXsd testing

**GeoJSON Builder Tests:**
- All GML geometry type conversions
- Feature and FeatureCollection building
- Envelope and Box handling
- Property merging
- Error handling for unsupported types

**CLI Tests:**
- Parse command with output file
- Convert command with version and pretty-print
- Validate command
- Command exposure verification

---

## 🐛 Bug Fixes

- Fixed property normalization for complex nested structures
- Improved getText handling for edge cases
- Better error messages for invalid GML inputs

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

---

## 📦 Dependencies

No major dependency updates in this release.

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.1.1.

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure comprehensive test coverage and code quality.

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Issues:** Report bugs at [GitHub Issues](https://github.com/yourusername/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)

---

## 🔜 What's Next

Future improvements may include:
- Validator coverage improvement (HTTP fetch testing)
- Additional CLI command tests
- Performance optimizations
- More GML version support

---

**Full Changelog:** v1.1.1...v1.1.2
