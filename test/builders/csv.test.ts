import { CsvBuilder } from '../../src/builders/csv.js';
import type {
    GmlPoint,
    GmlLineString,
    GmlPolygon,
    GmlMultiPoint,
    GmlEnvelope,
    GmlFeature,
    GmlFeatureCollection,
    GmlRectifiedGridCoverage,
} from '../../src/types.js';

describe('CsvBuilder', () => {
    let builder: CsvBuilder;

    beforeEach(() => {
        builder = new CsvBuilder();
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
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], // Outer ring
                    [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]],       // Inner ring (hole)
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
    });

    describe('Envelope and Box', () => {
        it('should convert Envelope to CSV output', () => {
            const envelope: GmlEnvelope = {
                type: 'Envelope',
                bbox: [10.0, 20.0, 30.0, 40.0],
                srsName: 'EPSG:4326',
                version: '3.2',
            };

            const output = builder.buildEnvelope(envelope);
            expect(output.type).toBe('CSV');
            expect(output.headers).toContain('geometry');
            expect(output.headers).toContain('type');
            expect(output.headers).toContain('minX');
            expect(output.headers).toContain('maxY');
            expect(output.rows.length).toBe(1);
            expect(output.rows[0].geometry).toBe('POLYGON ((10 20, 30 20, 30 40, 10 40, 10 20))');
            expect(output.rows[0].type).toBe('Envelope');
            expect(output.rows[0].srsName).toBe('EPSG:4326');
        });
    });

    describe('Features', () => {
        it('should convert Feature to CSV output', () => {
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

            const output = builder.buildFeature(feature);
            expect(output.type).toBe('CSV');
            expect(output.headers).toContain('id');
            expect(output.headers).toContain('geometry');
            expect(output.headers).toContain('name');
            expect(output.headers).toContain('value');
            expect(output.rows.length).toBe(1);
            expect(output.rows[0].id).toBe('F1');
            expect(output.rows[0].geometry).toBe('POINT (10 20)');
            expect(output.rows[0].name).toBe('Test Point');
            expect(output.rows[0].value).toBe(42);
        });

        it('should convert FeatureCollection to CSV string', () => {
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
                        properties: { name: 'Point 1', value: 100 },
                        version: '3.2',
                    },
                    {
                        id: 'F2',
                        geometry: {
                            type: 'Point',
                            coordinates: [15.0, 25.0],
                            version: '3.2',
                        },
                        properties: { name: 'Point 2', value: 200 },
                        version: '3.2',
                    },
                ],
                version: '3.2',
            };

            const csv = builder.buildFeatureCollection(featureCollection);
            expect(csv).toContain('id,geometry,name,value');
            expect(csv).toContain('F1,POINT (10 20),Point 1,100');
            expect(csv).toContain('F2,POINT (15 25),Point 2,200');
        });

        it('should handle empty FeatureCollection', () => {
            const featureCollection: GmlFeatureCollection = {
                type: 'FeatureCollection',
                features: [],
                version: '3.2',
            };

            const csv = builder.buildFeatureCollection(featureCollection);
            expect(csv).toBe('id,geometry\n');
        });

        it('should escape CSV special characters', () => {
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
                        properties: {
                            name: 'Test, Point',
                            description: 'Contains "quotes"',
                        },
                        version: '3.2',
                    },
                ],
                version: '3.2',
            };

            const csv = builder.buildFeatureCollection(featureCollection);
            expect(csv).toContain('"Test, Point"');
            expect(csv).toContain('"Contains ""quotes"""');
        });
    });

    describe('Coverages', () => {
        it('should convert RectifiedGridCoverage to CSV output', () => {
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

            const output = builder.buildRectifiedGridCoverage(coverage);
            expect(output.type).toBe('CSV');
            expect(output.rows.length).toBe(1);
            expect(output.rows[0].id).toBe('COV1');
            expect(output.rows[0].type).toBe('RectifiedGridCoverage');
            expect(output.rows[0].geometry).toBe('POLYGON ((1 1, 10 1, 10 20, 1 20, 1 1))');
            expect(output.rows[0].dataFile).toBe('coverage.tif');
            expect(output.rows[0].bands).toBe('red;green;blue');
        });
    });
});
