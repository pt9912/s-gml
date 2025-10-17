/**
 * Jest setup file to mock ESM-only packages
 */

// Mock flatgeobuf library globally
jest.mock('flatgeobuf/lib/mjs/geojson.js', () => ({
    serialize: jest.fn(() => {
        // Create a mock FlatGeobuf binary with magic bytes
        const mockData = new Uint8Array([
            0x66, // 'f'
            0x67, // 'g'
            0x62, // 'b'
            0x03, // version
            ...new Array(100).fill(0), // Mock data
        ]);
        return mockData;
    }),
}));

// Mock @ngageoint/geopackage library globally
jest.mock('@ngageoint/geopackage', () => ({
    GeoPackageAPI: {
        create: jest.fn(async () => ({
            addGeoJSONFeaturesToGeoPackage: jest.fn(async () => Promise.resolve()),
            export: jest.fn(async () => {
                // Create a mock GeoPackage binary (SQLite format starts with "SQLite format 3")
                const header = 'SQLite format 3\x00';
                const mockData = new Uint8Array(1024);
                for (let i = 0; i < header.length; i++) {
                    mockData[i] = header.charCodeAt(i);
                }
                return mockData;
            }),
        })),
    },
}));
