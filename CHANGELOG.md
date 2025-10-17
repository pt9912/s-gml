# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-10-17

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
  - Total test count: 499 tests (up from 414)

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

### Test Coverage
- Overall statement coverage: 78.15%
- CisJsonBuilder coverage: 82.85%
- CoverageJsonBuilder coverage: 84.94%
- GeoPackageBuilder coverage: 48.38% (mocked external library)
- FlatGeobufBuilder coverage: 40.74% (mocked external library)

## [1.6.0] - 2025-10-16

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

## [1.5.0] - 2025-10-16

### Added
- **WCS 2.0 XML Coverage Generator**
  - `CoverageGenerator` class for generating WCS 2.0 compliant XML
  - Support for all 4 coverage types (RectifiedGrid, Grid, ReferenceableGrid, MultiPoint)
  - Multi-band RangeType generation with SWE DataRecord
  - Pretty-print XML formatting option
  - XML escaping for safe output
  - Helper function `generateCoverageXml()`
  - 10 comprehensive tests for Coverage Generator

- **Multi-band RangeType Tests**
  - RGB Coverage test (3 bands)
  - Landsat-8 hyperspectral test (7 bands)
  - Weather station multi-parameter test (4 parameters)
  - GeoTIFF metadata extraction from multi-band coverage
  - 4 comprehensive tests validating existing multi-band support

### Changed
- **README.md**
  - Added "Coverage zu WCS 2.0 XML generieren" section with examples
  - Added CoverageGenerator to features table
  - Added CoverageGenerator API documentation
  - Included multi-band RangeType example
  - Added round-trip conversion example
  - Total test count: 247 tests (up from 233)

- **Exports** (`src/index.ts`)
  - Exported `CoverageGenerator` class
  - Exported `generateCoverageXml` helper function

### Examples
```typescript
// Generate WCS 2.0 XML from Coverage object
import { CoverageGenerator } from '@npm9912/s-gml';

const generator = new CoverageGenerator();
const xml = generator.generate(coverage);

// With pretty-print
const xmlPretty = generator.generate(coverage, true);

// Multi-band RangeType
const rgbCoverage = {
  type: 'RectifiedGridCoverage',
  domainSet: { /* grid definition */ },
  rangeType: {
    field: [
      { name: 'red', dataType: 'uint8', uom: 'W.m-2.sr-1' },
      { name: 'green', dataType: 'uint8', uom: 'W.m-2.sr-1' },
      { name: 'blue', dataType: 'uint8', uom: 'W.m-2.sr-1' }
    ]
  },
  // ...
};
```

## [1.4.0] - 2025-10-16

### Added
- **WCS Coverage Support**
  - `RectifiedGridCoverage` parsing with georeferenced grid and affine transformation
  - `GridCoverage` parsing with non-georeferenced grid
  - `ReferenceableGridCoverage` parsing with irregular georeferencing
  - `MultiPointCoverage` parsing with arbitrarily distributed points
  - 3 comprehensive tests for Coverage types

- **JSON Coverage Output Formats**
  - **CIS JSON Builder** (OGC 09-146r8) - Coverage Implementation Schema JSON format
  - **CoverageJSON Builder** (OGC 21-069r2) - Web-optimized coverage format
  - Support for format aliases: `'cis-json'`, `'json-coverage'`, `'coveragejson'`, `'covjson'`
  - 15 comprehensive tests for JSON builders

- **GeoTIFF Metadata Utilities**
  - `extractGeoTiffMetadata()` - Extract GeoTIFF-compatible metadata from Grid coverages
  - `pixelToWorld()` - Transform pixel coordinates to world coordinates
  - `worldToPixel()` - Transform world coordinates to pixel coordinates
  - Affine transformation matrix calculation
  - Pixel resolution and rotation extraction
  - 3 tests for GeoTIFF utilities

### Changed
- **README.md**
  - Removed deprecated "Neue GML-Elemente" feature row
  - Added Coverage-Unterstützung feature with all 4 coverage types
  - Added JSON-Coverage-Formate feature (CIS JSON + CoverageJSON)
  - Updated main description to mention WFS-/WCS-Unterstützung
  - Added comprehensive Coverage parsing examples
  - Added GeoTIFF metadata extraction examples
  - Added JSON coverage format examples (3 formats)
  - Added MultiPointCoverage to supported elements table
  - Total test count: 233 tests (up from 212)

- **Builders** (`src/builders/`)
  - Extended `GeoJsonBuilder` with 4 coverage build methods
  - New `CisJsonBuilder` for OGC CIS JSON output
  - New `CoverageJsonBuilder` for OGC CoverageJSON output
  - `getBuilder()` now supports coverage format aliases

- **Parser** (`src/parser.ts`)
  - Added coverage type detection and parsing
  - New methods: `parseRectifiedGridCoverage()`, `parseGridCoverage()`, `parseReferenceableGridCoverage()`, `parseMultiPointCoverage()`
  - Extended type guards for coverage types

- **Type System** (`src/types.ts`)
  - New interfaces: `GmlRectifiedGridCoverage`, `GmlGridCoverage`, `GmlReferenceableGridCoverage`, `GmlMultiPointCoverage`
  - New types: `GmlGridEnvelope`, `GmlRectifiedGrid`, `GmlGrid`, `GmlRangeSet`, `GmlRangeType`
  - Extended `Builder` interface with coverage methods
  - New union type: `GmlCoverage`

### Examples
```typescript
// Parse GML Coverage to GeoJSON
const parser = new GmlParser();
const coverage = await parser.parse(coverageGml);
// { type: 'Feature', properties: { coverageType: 'RectifiedGridCoverage', grid: {...} } }

// Parse to CIS JSON
const cisParser = new GmlParser('cis-json');
const cisJson = await cisParser.parse(coverageGml);
// { "@context": "http://www.opengis.net/cis/1.1/json", ... }

// Parse to CoverageJSON
const covjsonParser = new GmlParser('coveragejson');
const covJson = await covjsonParser.parse(coverageGml);
// { "type": "Coverage", "domain": {...}, "parameters": {...}, "ranges": {...} }

// Extract GeoTIFF metadata
import { extractGeoTiffMetadata, pixelToWorld } from '@npm9912/s-gml';
const metadata = extractGeoTiffMetadata(coverageObject);
const worldCoords = pixelToWorld(50, 100, metadata);
```

## [1.3.0] - 2025-10-06

### Added
- **URL Parsing Support**
  - `parseFromUrl(url)` method for direct GML/WFS parsing from URLs
  - `convertFromUrl(url, options)` method for URL-based GML conversion
  - 6 comprehensive tests for URL methods
  - Automatic error handling for failed HTTP requests

- **Custom Builder Support**
  - `GmlParser` constructor now accepts custom `Builder` objects
  - Support for implementing custom output formats beyond GeoJSON
  - Full `Builder` interface documentation in README
  - 3 tests for custom builder functionality

### Changed
- `GmlParser` constructor signature: `constructor(targetFormat: string | Builder = 'geojson')`
- Enhanced README with extensive examples for URL parsing and custom builders
- Total test count: 212 tests (up from 203)

### Examples
```typescript
// URL Parsing
const parser = new GmlParser();
const geojson = await parser.parseFromUrl('https://example.com/wfs?...');

// Custom Builder
class MyBuilder implements Builder { ... }
const parser = new GmlParser(new MyBuilder());
```

## [1.2.0] - 2025-10-06

### Added
- **WFS Integration Tests**: 28 comprehensive integration tests for WFS 1.0, 1.1, and 2.0
  - WFS 2.0 with GML 3.2 parsing tests (7 tests)
  - WFS 1.1 with GML 3.0 parsing tests (5 tests)
  - WFS 1.0 with GML 2.1.2 parsing tests (9 tests)
  - Version comparison tests (4 tests)
  - Real-world data integrity tests (3 tests)
- Support for `wfs:member` elements (WFS 2.0)
- Support for `fid` attribute as feature ID (GML 2.1.2)
- Content-based GML version detection for unversioned namespaces
- Real-world WFS sample files for testing (wfs-gml32-1-f.xml, wfs-gml3-1-f.xml, wfs-3-f.xml)

### Changed
- Improved GML version detection with content-based fallback
  - Checks for GML 2.1.2 specific elements (gml:coordinates, outerBoundaryIs, innerBoundaryIs)
  - Defaults to GML 3.2 for unversioned namespace (http://www.opengis.net/gml)
- Enhanced `gml:featureMembers` array handling
- Total test count: 203 tests (up from 175)

### Fixed
- WFS 2.0 feature extraction from `wfs:member` elements
- WFS 1.1 array handling in `gml:featureMembers`
- GML 2.1.2 detection for unversioned GML namespace
- MultiPoint and MultiLineString validation for empty member elements

## [1.1.4] - 2025-10-06

### Added
- Browser-compatible validator (`validator.browser.ts`) using WASM and Fetch API
- Node.js-specific validator (`validator.node.ts`) with native xmllint support
- 12 new browser compatibility tests
- Total test count: 175 tests (up from 163)

### Changed
- Split validator into browser and Node.js versions for better compatibility
- npm package now exports browser-compatible validator by default
- CLI tool uses Node.js validator with native xmllint
- Rollup configs mark Node.js built-ins as external

### Fixed
- Browser compatibility: Fixed Vite/bundler errors with Node.js modules
- Resolved "Module externalized for browser compatibility" errors
- validator.browser.ts now uses Fetch API instead of Node.js http/https

## [1.1.3] - 2025-10-06

### Added
- Native xmllint support in Docker image for faster and more reliable XSD validation
- WFS sample files for integration testing (test/gml/)
- Repository URL in package.json

### Changed
- Validator now prefers native xmllint when available, falls back to WASM
- Test mode uses WASM with custom fetcher for proper mocking

### Fixed
- Validator tests now respect custom XSD fetcher instead of using native xmllint
- Parser ignores `gml:null` elements in boundedBy
- Parser ignores underscore (_) properties to avoid internal metadata

## [1.1.2] - 2025-10-05

### Added
- 71 new comprehensive tests across all components
- New test file: `test/geojson.test.ts` for GeoJSON builder testing
- XSD caching mechanism in validator for improved performance
- `__setXsdFetcher()` and `__clearXsdCache()` test utilities
- Exported `__internal` methods from validator for better testability
- Tests for all GML geometry types (Point, LineString, Polygon, Multi*, etc.)
- Tests for GML versions 2.1.2 and 3.2
- CLI command tests (parse, convert, validate)
- Edge case and error handling tests
- Property normalization tests
- Coordinate parsing tests with various formats

### Changed
- Improved test coverage from 54% to 88% overall
- Enhanced parser coverage from 51% to 88.7%
- Boosted generator coverage from 46.9% to 98.96%
- Increased geojson builder coverage from 65.85% to 97.56%
- Updated Jest configuration for better coverage reporting
- Improved error messages in validator
- Enhanced property normalization in parser
- Better handling of nested objects and arrays

### Fixed
- Property normalization for complex nested structures
- getText handling for edge cases
- Error messages for invalid GML inputs

### Development
- Added JSON plugin for Rollup builds
- Improved Docker configuration with libxmljs rebuild
- Updated build scripts and dependencies
- Removed obsolete test mocks

## [1.1.1] - 2025-10-xx

### Changed
- Minor improvements and bug fixes

## [1.1.0] - 2025-10-xx

### Added
- Initial release with GML parsing, conversion, and validation
- Support for GML 2.1.2 and 3.2
- CLI tool for GML operations
- GeoJSON conversion

[1.7.0]: https://github.com/pt9912/s-gml/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/pt9912/s-gml/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/pt9912/s-gml/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/pt9912/s-gml/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/pt9912/s-gml/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/pt9912/s-gml/compare/v1.1.4...v1.2.0
[1.1.4]: https://github.com/pt9912/s-gml/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/pt9912/s-gml/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/pt9912/s-gml/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/pt9912/s-gml/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/pt9912/s-gml/releases/tag/v1.1.0
