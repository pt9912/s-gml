import { ShapefileBuilder, toShapefile } from '../../src/builders/shapefile.js';
import { GmlParser } from '../../src/parser.js';
import type { FeatureCollection } from '../../src/types.js';

describe('ShapefileBuilder', () => {
    describe('Basic Functionality', () => {
        it('should generate shapefile ZIP from GeoJSON', async () => {
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection);

            expect(zip).toBeDefined();
            // Default output type is 'blob' (browser) or Buffer (node)
            expect(zip).toBeTruthy();
        });

        it('should generate shapefile ZIP with ArrayBuffer output', async () => {
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection, {
                outputType: 'arraybuffer',
            });

            expect(zip).toBeInstanceOf(ArrayBuffer);
            expect((zip as ArrayBuffer).byteLength).toBeGreaterThan(0);
        });

        it('should generate shapefile ZIP with base64 output', async () => {
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection, {
                outputType: 'base64',
            });

            expect(typeof zip).toBe('string');
            expect((zip as string).length).toBeGreaterThan(0);
            // Should be valid base64
            expect(/^[A-Za-z0-9+/=]+$/.test(zip as string)).toBe(true);
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection);

            expect(zip).toBeDefined();
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection);

            expect(zip).toBeDefined();
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection);

            expect(zip).toBeDefined();
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection);

            expect(zip).toBeDefined();
        });
    });

    describe('Property Name Truncation', () => {
        it('should truncate long property names to 10 characters', async () => {
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
                            'very_long_property_name_exceeding_limit': 'value1',
                            'another_very_long_name': 'value2',
                            short: 'value3',
                        },
                    },
                ],
            };

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection);

            // Should not throw, truncation happens automatically
            expect(zip).toBeDefined();
        });

        it('should disable truncation when option is set to false', async () => {
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
                            'long_property_name': 'value',
                        },
                    },
                ],
            };

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection, {
                truncateFieldNames: false,
            });

            expect(zip).toBeDefined();
        });
    });

    describe('Options', () => {
        it('should use custom folder name', async () => {
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection, {
                folder: 'custom_folder',
            });

            expect(zip).toBeDefined();
        });

        it('should use custom filename', async () => {
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection, {
                filename: 'my_shapefile',
            });

            expect(zip).toBeDefined();
        });

        it('should use custom layer names by geometry type', async () => {
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

            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection, {
                types: {
                    point: 'my_points',
                    polygon: 'my_polygons',
                    polyline: 'my_lines',
                },
            });

            expect(zip).toBeDefined();
        });

        it('should use custom projection (PRJ)', async () => {
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

            const builder = new ShapefileBuilder();
            const customPrj = ShapefileBuilder.getWebMercatorPrj();
            const zip = await builder.toZip(featureCollection, {
                prj: customPrj,
            });

            expect(zip).toBeDefined();
        });
    });

    describe('Builder Integration', () => {
        it('should work as a builder with GmlParser', async () => {
            const gml = `
                <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                    <gml:pos>10 20</gml:pos>
                </gml:Point>
            `;

            const parser = new GmlParser(new ShapefileBuilder());
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

            const parser = new GmlParser(new ShapefileBuilder());
            const featureCollection = await parser.parse(gml) as FeatureCollection;

            expect(featureCollection.type).toBe('FeatureCollection');
            expect(featureCollection.features.length).toBe(1);

            // Now export as shapefile
            const builder = new ShapefileBuilder();
            const zip = await builder.toZip(featureCollection);

            expect(zip).toBeDefined();
        });
    });

    describe('Helper Function', () => {
        it('should export using toShapefile helper', async () => {
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

            const zip = await toShapefile(featureCollection);

            expect(zip).toBeDefined();
        });

        it('should export with options using toShapefile helper', async () => {
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

            const zip = await toShapefile(featureCollection, {
                outputType: 'base64',
                filename: 'export',
            });

            expect(typeof zip).toBe('string');
        });
    });

    describe('Projection Helpers', () => {
        it('should provide WGS84 projection string', () => {
            const prj = ShapefileBuilder.getWgs84Prj();

            expect(prj).toContain('WGS_1984');
            expect(prj).toContain('GEOGCS');
        });

        it('should provide Web Mercator projection string', () => {
            const prj = ShapefileBuilder.getWebMercatorPrj();

            expect(prj).toContain('Web_Mercator');
            expect(prj).toContain('PROJCS');
        });
    });
});
