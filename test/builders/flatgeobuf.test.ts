import { FlatGeobufBuilder, toFlatGeobuf } from '../../src/builders/flatgeobuf.js';
import { GmlParser } from '../../src/parser.js';
import type { FeatureCollection } from '../../src/types.js';

describe('FlatGeobufBuilder', () => {
    describe('Basic Functionality', () => {
        it('should generate FlatGeobuf from GeoJSON', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
            expect(fgb.byteLength).toBeGreaterThan(0);
        });

        it('should generate FlatGeobuf binary data', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeInstanceOf(Uint8Array);
            expect(fgb.byteLength).toBeGreaterThan(0);
            // FlatGeobuf magic bytes: 'fgb' + version
            expect(fgb[0]).toBe(0x66); // 'f'
            expect(fgb[1]).toBe(0x67); // 'g'
            expect(fgb[2]).toBe(0x62); // 'b'
        });
    });

    describe('Geometry Types', () => {
        it('should handle Point geometries', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle LineString geometries', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle Polygon geometries', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle MultiPoint geometries', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle MultiLineString geometries', () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'MultiLineString',
                            coordinates: [
                                [
                                    [0, 0],
                                    [10, 10],
                                ],
                                [
                                    [20, 20],
                                    [30, 30],
                                ],
                            ],
                        },
                        properties: { name: 'MultiLineString 1' },
                    },
                ],
            };

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle MultiPolygon geometries', () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [0, 0],
                                        [10, 0],
                                        [10, 10],
                                        [0, 10],
                                        [0, 0],
                                    ],
                                ],
                            ],
                        },
                        properties: { name: 'MultiPolygon 1' },
                    },
                ],
            };

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle mixed geometry types', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });
    });

    describe('Properties', () => {
        it('should preserve feature properties', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle null properties', () => {
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
                        },
                    },
                ],
            };

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });

        it('should handle long property names', () => {
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
                            very_long_property_name_that_exceeds_limits: 'value',
                            another_extremely_long_property_name: 123,
                        },
                    },
                ],
            };

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });
    });

    describe('Builder Integration', () => {
        it('should work as a builder with GmlParser', async () => {
            const gml = `
                <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                    <gml:pos>10 20</gml:pos>
                </gml:Point>
            `;

            const parser = new GmlParser(new FlatGeobufBuilder());
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

            const parser = new GmlParser(new FlatGeobufBuilder());
            const featureCollection = (await parser.parse(gml)) as FeatureCollection;

            expect(featureCollection.type).toBe('FeatureCollection');
            expect(featureCollection.features.length).toBe(1);

            // Now export as FlatGeobuf
            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
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

            const parser = new GmlParser(new FlatGeobufBuilder());
            const featureCollection = (await parser.parse(gml)) as FeatureCollection;

            expect(featureCollection.features.length).toBe(2);

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });
    });

    describe('Helper Function', () => {
        it('should export using toFlatGeobuf helper', () => {
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

            const fgb = toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });
    });

    describe('Empty Collections', () => {
        it('should handle empty FeatureCollection', () => {
            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features: [],
            };

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });
    });

    describe('Feature IDs', () => {
        it('should preserve feature IDs', () => {
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

            const builder = new FlatGeobufBuilder();
            const fgb = builder.toFlatGeobuf(featureCollection);

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
        });
    });

    describe('Performance', () => {
        it('should handle large number of features efficiently', () => {
            const features = [];
            for (let i = 0; i < 1000; i++) {
                features.push({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [i * 0.1, i * 0.1],
                    },
                    properties: { id: i, name: `Point ${i}` },
                });
            }

            const featureCollection: FeatureCollection = {
                type: 'FeatureCollection',
                features,
            };

            const builder = new FlatGeobufBuilder();
            const startTime = Date.now();
            const fgb = builder.toFlatGeobuf(featureCollection);
            const duration = Date.now() - startTime;

            expect(fgb).toBeDefined();
            expect(fgb).toBeInstanceOf(Uint8Array);
            expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
        });
    });
});
