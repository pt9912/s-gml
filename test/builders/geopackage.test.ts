import { GeoPackageBuilder, toGeoPackage } from '../../src/builders/geopackage.js';
import { GmlParser } from '../../src/parser.js';
import type { FeatureCollection } from '../../src/types.js';

describe('GeoPackageBuilder', () => {
    describe('Basic Functionality', () => {
        it('should generate GeoPackage from GeoJSON', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 'F1',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: {
                            name: 'Test Point',
                            value: 42,
                        },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
            expect(gpkg.byteLength).toBeGreaterThan(0);
        });

        it('should generate GeoPackage with custom table name', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: { name: 'Point' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection, {
                tableName: 'my_features',
            });

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should generate GeoPackage with default options', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: { name: 'Point' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });
    });

    describe('Geometry Types', () => {
        it('should handle Point geometries', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: { name: 'Point 1' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should handle LineString geometries', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [0, 0],
                                [10, 10],
                                [20, 20],
                            ],
                        },
                        properties: { name: 'Line 1' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should handle Polygon geometries', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [10, 0],
                                    [10, 10],
                                    [0, 10],
                                    [0, 0],
                                ],
                            ],
                        },
                        properties: { name: 'Polygon 1' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should handle MultiPoint geometries', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'MultiPoint',
                            coordinates: [
                                [0, 0],
                                [5, 5],
                                [10, 10],
                            ],
                        },
                        properties: { name: 'MultiPoint 1' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should handle mixed geometry types', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: { name: 'Point' },
                    },
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [0, 0],
                                [10, 10],
                            ],
                        },
                        properties: { name: 'Line' },
                    },
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [10, 0],
                                    [10, 10],
                                    [0, 10],
                                    [0, 0],
                                ],
                            ],
                        },
                        properties: { name: 'Polygon' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });
    });

    describe('Properties', () => {
        it('should preserve feature properties', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: {
                            name: 'Test Location',
                            population: 50000,
                            active: true,
                            elevation: 1234.56,
                        },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should handle null and undefined properties', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: {
                            name: 'Test',
                            nullValue: null,
                            undefinedValue: undefined,
                        },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should handle complex property values', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: {
                            name: 'Complex Feature',
                            tags: ['tag1', 'tag2', 'tag3'],
                            metadata: { key1: 'value1', key2: 'value2' },
                        },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });
    });

    describe('Builder Integration', () => {
        it('should work as a builder with GmlParser', async () => {
            const gml = `
                <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                    <gml:pos>10 20</gml:pos>
                </gml:Point>
            `;

            const parser = new GmlParser(new GeoPackageBuilder());
            const geometry = await parser.parse(gml);

            expect(geometry).toBeDefined();
            expect(geometry.type).toBe('Point');
        });

        it('should work with GML FeatureCollection', async () => {
            const gml = `
                <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"
                                        xmlns:gml="http://www.opengis.net/gml/3.2">
                    <wfs:member>
                        <TestFeature gml:id="F1">
                            <geometry>
                                <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                            </geometry>
                            <name>Feature 1</name>
                        </TestFeature>
                    </wfs:member>
                </wfs:FeatureCollection>
            `;

            const parser = new GmlParser(new GeoPackageBuilder());
            const featureCollection = (await parser.parse(gml)) as FeatureCollection;

            expect(featureCollection.type).toBe('FeatureCollection');
            expect(featureCollection.features.length).toBe(1);

            // Now export as GeoPackage
            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should parse multiple features', async () => {
            const gml = `
                <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"
                                        xmlns:gml="http://www.opengis.net/gml/3.2">
                    <wfs:member>
                        <TestFeature gml:id="F1">
                            <geometry>
                                <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                            </geometry>
                            <name>Feature 1</name>
                        </TestFeature>
                    </wfs:member>
                    <wfs:member>
                        <TestFeature gml:id="F2">
                            <geometry>
                                <gml:Point><gml:pos>30 40</gml:pos></gml:Point>
                            </geometry>
                            <name>Feature 2</name>
                        </TestFeature>
                    </wfs:member>
                </wfs:FeatureCollection>
            `;

            const parser = new GmlParser(new GeoPackageBuilder());
            const featureCollection = (await parser.parse(gml)) as FeatureCollection;

            expect(featureCollection.features.length).toBe(2);

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });
    });

    describe('Helper Function', () => {
        it('should export using toGeoPackage helper', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: { name: 'Test' },
                    },
                ],
            };

            const gpkg = await toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });

        it('should export with options using toGeoPackage helper', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: { name: 'Test' },
                    },
                ],
            };

            const gpkg = await toGeoPackage(featureCollection, {
                tableName: 'my_table',
            });

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });
    });

    describe('Empty Collections', () => {
        it('should handle empty FeatureCollection', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });
    });

    describe('Feature IDs', () => {
        it('should preserve feature IDs', async () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 'custom_id_1',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                        },
                        properties: { name: 'Test 1' },
                    },
                    {
                        type: 'Feature',
                        id: 'custom_id_2',
                        geometry: {
                            type: 'Point',
                            coordinates: [30, 40],
                        },
                        properties: { name: 'Test 2' },
                    },
                ],
            };

            const builder = new GeoPackageBuilder();
            const gpkg = await builder.toGeoPackage(featureCollection);

            expect(gpkg).toBeDefined();
            expect(Buffer.isBuffer(gpkg)).toBe(true);
        });
    });
});
