# Release Notes - v1.1.3

**Release Date:** 2025-10-06

## 🎉 Overview

This release improves validation performance and reliability by adding native xmllint support in Docker, while maintaining backward compatibility with WASM-based validation. It also includes important parser fixes for handling WFS responses with null boundaries.

---

## ✨ Highlights

### 🚀 Performance Improvements

**Native xmllint Support:**
- Docker images now include `libxml2-utils` for native xmllint validation
- Significantly faster XSD validation compared to WASM fallback
- More reliable handling of complex schema references
- Automatic fallback to WASM when xmllint is not available

### 🧪 Testing Improvements

**WFS Sample Files:**
- Added real-world WFS response samples from OpenStreetMap
- Integration tests with actual WFS FeatureCollection data
- Better coverage of edge cases (null boundedBy, MultiPolygon features)

### 🐛 Bug Fixes

**Parser Enhancements:**
- Fixed handling of `gml:null` elements in boundedBy
- Removed internal underscore (_) properties from parsed features
- Better handling of WFS responses with missing boundaries

**Validator Improvements:**
- Test mode now properly respects custom XSD fetchers for mocking
- Native xmllint is skipped when custom fetcher is set (for tests)

---

## 🔧 Detailed Changes

### Added

- Native xmllint support in Docker image (both builder and runtime stages)
- WFS sample files in `test/gml/` directory:
  - `wfs-3-f.xml` - Large WFS response with multiple features
  - `wfs-4-f.xml` - WFS response with null boundedBy
  - `wfs-5-f.xml` - WFS response with water area features
- Repository URL in package.json for better npm metadata

### Changed

- Validator strategy: prefer native xmllint when available, fall back to WASM
- Test mode forces WASM usage for proper schema mocking
- Updated .dockerignore to include test files for Docker builds
- Enhanced .gitignore with local development directories (.claude/, .wfs/)

### Fixed

- **Validator:** Custom XSD fetcher now properly bypasses native xmllint in tests
- **Parser:** Ignores `gml:null` elements in boundedBy to prevent parsing errors
- **Parser:** Filters out underscore (_) properties used for internal metadata

---

## 📊 Performance Impact

**Validation Speed (estimated):**
- Native xmllint: ~10-50ms for typical GML documents
- WASM fallback: ~100-300ms for the same documents
- **Improvement:** Up to 6x faster validation in Docker environments

---

## 🔒 Breaking Changes

None - this release is fully backward compatible.

---

## 📝 Commit Summary

This release includes 6 commits since v1.1.2:

1. **234278a** - fix: ensure validator tests use custom fetcher instead of native xmllint
2. **cf21cca** - chore: update ignore files for test data and Claude directories
3. **9d7e8b0** - feat: add native xmllint support to Docker image
4. **2bd307e** - chore: bump version to 1.1.1 and add repository field
5. **7aa96bc** - fix: handle null boundedBy elements and ignore underscore properties
6. **666c73c** - test: add WFS sample files for integration testing

---

## 🚀 Migration Guide

No migration needed - this is a drop-in replacement for v1.1.2.

### Docker Users

If you're using Docker, you'll automatically benefit from native xmllint validation. No changes required.

### npm Users

The package continues to work with WASM-based validation. For better performance, consider installing `libxml2-utils` on your system:

**Ubuntu/Debian:**
```bash
sudo apt-get install libxml2-utils
```

**Alpine:**
```bash
apk add --no-cache libxml2-utils
```

**macOS:**
```bash
brew install libxml2
```

---

## 🧪 Testing

All 163 tests pass successfully:
- 9 test suites ✅
- 163 tests ✅
- Coverage: 88.53% statements, 77.18% branches

---

## 📦 Docker Image

Build the updated Docker image:

```bash
docker build -t s-gml-cli .
```

The image now includes native xmllint for fast validation:

```bash
docker run --rm -v $(pwd):/data s-gml-cli validate /data/input.gml --gml-version 3.2
```

---

## 🙏 Acknowledgments

This release was developed with assistance from Claude Code to ensure optimal performance and test coverage.

---

## 📚 Resources

- **Documentation:** See README.md for usage examples
- **Repository:** [github.com/pt9912/s-gml](https://github.com/pt9912/s-gml)
- **Issues:** Report bugs at [GitHub Issues](https://github.com/pt9912/s-gml/issues)
- **NPM:** [@npm9912/s-gml](https://www.npmjs.com/package/@npm9912/s-gml)

---

## 🔜 What's Next

Future improvements may include:
- Additional WFS version support
- Enhanced schema catalog for complex GML applications
- Performance optimizations for large FeatureCollections
- Support for GML 3.1.1

---

**Full Changelog:** [v1.1.2...v1.1.3](https://github.com/pt9912/s-gml/compare/v1.1.2...v1.1.3)
