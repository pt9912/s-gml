/**
 * Mock for @ngageoint/geopackage library
 */

export class GeoPackageAPI {
    static async create(): Promise<MockGeoPackage> {
        return new MockGeoPackage();
    }
}

class MockGeoPackage {
    async addGeoJSONFeaturesToGeoPackage(
        _features: any[],
        _tableName: string,
        _indexFeatures: boolean
    ): Promise<void> {
        // Mock implementation
        return Promise.resolve();
    }

    async export(): Promise<Uint8Array> {
        // Create a mock GeoPackage binary (SQLite format starts with "SQLite format 3")
        const header = 'SQLite format 3\x00';
        const mockData = new Uint8Array(1024);
        for (let i = 0; i < header.length; i++) {
            mockData[i] = header.charCodeAt(i);
        }
        return mockData;
    }
}
