import { WktBuilder, wktCollectionToCsv, wktCollectionToJson } from '../../src/builders/wkt.js';
import type {
    GmlPoint,
    GmlLineString,
    GmlPolygon,
    GmlMultiPoint,
    GmlMultiLineString,
    GmlMultiPolygon,
    GmlEnvelope,
    GmlFeature,
    GmlFeatureCollection,
    GmlRectifiedGridCoverage,
} from '../../src/types.js';

describe('WktBuilder', () => {
    let builder: WktBuilder;

    beforeEach(() => {
        builder = new WktBuilder();
    });

    describe('Basic Geometries', () => {
        it('should convert Point to WKT', () => {
            const point: GmlPoint = {
                type: 'Point',
                coordinates: [10.0, 20.0],
                version: '3.2',
            };

            const wkt = builder.buildPoint(point);
            expect(wkt).toBe('POINT (10 20)');
        });

        it('should convert 3D Point to WKT Z', () => {
            const point: GmlPoint = {
                type: 'Point',
                coordinates: [10.0, 20.0, 100.0],
                version: '3.2',
            };

            const wkt = builder.buildPoint(point);
            expect(wkt).toBe('POINT Z (10 20 100)');
        });

        it('should convert LineString to WKT', () => {
            const lineString: GmlLineString = {
                type: 'LineString',
                coordinates: [[10.0, 20.0], [15.0, 25.0], [20.0, 30.0]],
                version: '3.2',
            };

            const wkt = builder.buildLineString(lineString);
            expect(wkt).toBe('LINESTRING (10 20, 15 25, 20 30)');
        });

        it('should convert 3D LineString to WKT Z', () => {
            const lineString: GmlLineString = {
                type: 'LineString',
                coordinates: [[10.0, 20.0, 100.0], [15.0, 25.0, 150.0]],
                version: '3.2',
            };

            const wkt = builder.buildLineString(lineString);
            expect(wkt).toBe('LINESTRING Z (10 20 100, 15 25 150)');
        });

        it('should convert Polygon to WKT', () => {
            const polygon: GmlPolygon = {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                ],
                version: '3.2',
            };

            const wkt = builder.buildPolygon(polygon);
            expect(wkt).toBe('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))');
        });

        it('should convert Polygon with holes to WKT', () => {
            const polygon: GmlPolygon = {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                    [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]],
                ],
                version: '3.2',
            };

            const wkt = builder.buildPolygon(polygon);
            expect(wkt).toBe('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0), (2 2, 8 2, 8 8, 2 8, 2 2))');
        });

        it('should convert MultiPoint to WKT', () => {
            const multiPoint: GmlMultiPoint = {
                type: 'MultiPoint',
                coordinates: [[10, 20], [15, 25], [20, 30]],
                version: '3.2',
            };

            const wkt = builder.buildMultiPoint(multiPoint);
            expect(wkt).toBe('MULTIPOINT (10 20, 15 25, 20 30)');
        });

        it('should convert MultiLineString to WKT', () => {
            const multiLineString: GmlMultiLineString = {
                type: 'MultiLineString',
                coordinates: [
                    [[10, 20], [15, 25]],
                    [[20, 30], [25, 35]],
                ],
                version: '3.2',
            };

            const wkt = builder.buildMultiLineString(multiLineString);
            expect(wkt).toBe('MULTILINESTRING ((10 20, 15 25), (20 30, 25 35))');
        });

        it('should convert MultiPolygon to WKT', () => {
            const multiPolygon: GmlMultiPolygon = {
                type: 'MultiPolygon',
                coordinates: [
                    [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                    [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
                ],
                version: '3.2',
            };

            const wkt = builder.buildMultiPolygon(multiPolygon);
            expect(wkt).toBe('MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0)), ((20 20, 30 20, 30 30, 20 30, 20 20)))');
        });
    });

    describe('Envelope and Box', () => {
        it('should convert Envelope to WKT Feature', () => {
            const envelope: GmlEnvelope = {
                type: 'Envelope',
                bbox: [10.0, 20.0, 30.0, 40.0],
                srsName: 'EPSG:4326',
                version: '3.2',
            };

            const feature = builder.buildEnvelope(envelope);
            expect(feature.wkt).toBe('POLYGON ((10 20, 30 20, 30 40, 10 40, 10 20))');
            expect(feature.properties.type).toBe('Envelope');
            expect(feature.properties.minX).toBe(10);
            expect(feature.properties.maxY).toBe(40);
            expect(feature.properties.srsName).toBe('EPSG:4326');
        });
    });

    describe('Features', () => {
        it('should convert Feature to WKT Feature', () => {
            const feature: GmlFeature = {
                id: 'F1',
                geometry: {
                    type: 'Point',
                    coordinates: [10.0, 20.0],
                    version: '3.2',
                },
                properties: {
                    name: 'Test Point',
                    value: 42,
                },
                version: '3.2',
            };

            const wktFeature = builder.buildFeature(feature);
            expect(wktFeature.id).toBe('F1');
            expect(wktFeature.wkt).toBe('POINT (10 20)');
            expect(wktFeature.properties.name).toBe('Test Point');
            expect(wktFeature.properties.value).toBe(42);
        });

        it('should convert FeatureCollection to WKT Collection', () => {
            const featureCollection: GmlFeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        id: 'F1',
                        geometry: {
                            type: 'Point',
                            coordinates: [10.0, 20.0],
                            version: '3.2',
                        },
                        properties: { name: 'Point 1' },
                        version: '3.2',
                    },
                    {
                        id: 'F2',
                        geometry: {
                            type: 'Point',
                            coordinates: [15.0, 25.0],
                            version: '3.2',
                        },
                        properties: { name: 'Point 2' },
                        version: '3.2',
                    },
                ],
                version: '3.2',
            };

            const collection = builder.buildFeatureCollection(featureCollection);
            expect(collection.features).toHaveLength(2);
            expect(collection.features[0].id).toBe('F1');
            expect(collection.features[0].wkt).toBe('POINT (10 20)');
            expect(collection.features[1].id).toBe('F2');
            expect(collection.features[1].wkt).toBe('POINT (15 25)');
        });
    });

    describe('Coverages', () => {
        it('should convert RectifiedGridCoverage to WKT Feature', () => {
            const coverage: GmlRectifiedGridCoverage = {
                type: 'RectifiedGridCoverage',
                id: 'COV1',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [1, 1, 10, 20],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    dimension: 2,
                    srsName: 'EPSG:4326',
                    limits: { low: [0, 0], high: [99, 199] },
                    axisLabels: ['Lat', 'Long'],
                    origin: [10.0, 1.0],
                    offsetVectors: [[0, 0.1], [-0.1, 0]],
                },
                rangeSet: {
                    file: { fileName: 'coverage.tif', fileStructure: 'GeoTIFF' },
                },
                rangeType: {
                    field: [
                        { name: 'red', dataType: 'uint8' },
                        { name: 'green', dataType: 'uint8' },
                        { name: 'blue', dataType: 'uint8' },
                    ],
                },
                version: '3.2',
            };

            const feature = builder.buildRectifiedGridCoverage(coverage);
            expect(feature.id).toBe('COV1');
            expect(feature.wkt).toBe('POLYGON ((1 1, 10 1, 10 20, 1 20, 1 1))');
            expect(feature.properties.type).toBe('RectifiedGridCoverage');
            expect(feature.properties.dataFile).toBe('coverage.tif');
            expect(feature.properties.bands).toBe('red;green;blue');
        });

        it('should handle Coverage without boundedBy', () => {
            const coverage: GmlRectifiedGridCoverage = {
                type: 'RectifiedGridCoverage',
                id: 'COV1',
                domainSet: {
                    dimension: 2,
                    srsName: 'EPSG:4326',
                    limits: { low: [0, 0], high: [99, 199] },
                    origin: [10.0, 1.0],
                    offsetVectors: [[0, 0.1], [-0.1, 0]],
                },
                rangeSet: {
                    file: { fileName: 'coverage.tif' },
                },
                version: '3.2',
            };

            const feature = builder.buildRectifiedGridCoverage(coverage);
            expect(feature.wkt).toBe('POINT (10 1)');
        });
    });

    describe('Helper Functions', () => {
        it('should convert WKT Collection to JSON', () => {
            const collection = {
                features: [
                    {
                        id: 'F1',
                        wkt: 'POINT (10 20)',
                        properties: { name: 'Test' },
                    },
                ],
            };

            const json = wktCollectionToJson(collection, false);
            expect(json).toBe('{"features":[{"id":"F1","wkt":"POINT (10 20)","properties":{"name":"Test"}}]}');
        });

        it('should convert WKT Collection to pretty JSON', () => {
            const collection = {
                features: [
                    {
                        id: 'F1',
                        wkt: 'POINT (10 20)',
                        properties: { name: 'Test' },
                    },
                ],
            };

            const json = wktCollectionToJson(collection, true);
            expect(json).toContain('\n');
            expect(json).toContain('  ');
        });

        it('should convert WKT Collection to CSV', () => {
            const collection = {
                features: [
                    {
                        id: 'F1',
                        wkt: 'POINT (10 20)',
                        properties: { name: 'Point 1', value: 100 },
                    },
                    {
                        id: 'F2',
                        wkt: 'POINT (15 25)',
                        properties: { name: 'Point 2', value: 200 },
                    },
                ],
            };

            const csv = wktCollectionToCsv(collection);
            expect(csv).toContain('id,wkt,name,value');
            expect(csv).toContain('F1,POINT (10 20),Point 1,100');
            expect(csv).toContain('F2,POINT (15 25),Point 2,200');
        });

        it('should handle empty WKT Collection', () => {
            const collection = { features: [] };

            const csv = wktCollectionToCsv(collection);
            expect(csv).toBe('id,wkt\n');
        });
    });
});
