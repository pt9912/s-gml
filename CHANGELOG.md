# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.1.2] - 2025-01-05

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

## [1.1.1] - 2024-XX-XX

### Changed
- Minor improvements and bug fixes

## [1.1.0] - 2024-XX-XX

### Added
- Initial release with GML parsing, conversion, and validation
- Support for GML 2.1.2 and 3.2
- CLI tool for GML operations
- GeoJSON conversion

[1.3.0]: https://github.com/pt9912/s-gml/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/pt9912/s-gml/compare/v1.1.4...v1.2.0
[1.1.4]: https://github.com/pt9912/s-gml/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/pt9912/s-gml/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/pt9912/s-gml/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/pt9912/s-gml/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/pt9912/s-gml/releases/tag/v1.1.0
