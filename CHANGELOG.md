# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.1.4]: https://github.com/pt9912/s-gml/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/pt9912/s-gml/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/pt9912/s-gml/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/pt9912/s-gml/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/pt9912/s-gml/releases/tag/v1.1.0
