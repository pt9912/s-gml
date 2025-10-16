import { KmlBuilder } from '../../src/builders/kml.js';
import type {
    GmlPoint,
    GmlLineString,
    GmlPolygon,
    GmlMultiPoint,
    GmlFeature,
    GmlFeatureCollection,
    GmlRectifiedGridCoverage,
} from '../../src/types.js';

describe('KmlBuilder', () => {
    let builder: KmlBuilder;

    beforeEach(() => {
        builder = new KmlBuilder();
    });

    describe('Basic Geometries', () => {
        it('should convert Point to KML', () => {
            const point: GmlPoint = {
                type: 'Point',
                coordinates: [10.0, 20.0],
                version: '3.2',
            };

            const kml = builder.buildPoint(point);
            expect(kml).toBe('<Point><coordinates>10,20</coordinates></Point>');
        });

        it('should convert 3D Point to KML with altitude', () => {
            const point: GmlPoint = {
                type: 'Point',
                coordinates: [10.0, 20.0, 100.0],
                version: '3.2',
            };

            const kml = builder.buildPoint(point);
            expect(kml).toBe('<Point><coordinates>10,20,100</coordinates></Point>');
        });

        it('should convert LineString to KML', () => {
            const lineString: GmlLineString = {
                type: 'LineString',
                coordinates: [[10.0, 20.0], [15.0, 25.0], [20.0, 30.0]],
                version: '3.2',
            };

            const kml = builder.buildLineString(lineString);
            expect(kml).toBe('<LineString><coordinates>10,20 15,25 20,30</coordinates></LineString>');
        });

        it('should convert Polygon to KML', () => {
            const polygon: GmlPolygon = {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                ],
                version: '3.2',
            };

            const kml = builder.buildPolygon(polygon);
            expect(kml).toContain('<Polygon>');
            expect(kml).toContain('<outerBoundaryIs>');
            expect(kml).toContain('<LinearRing>');
            expect(kml).toContain('<coordinates>0,0 10,0 10,10 0,10 0,0</coordinates>');
            expect(kml).toContain('</Polygon>');
        });

        it('should convert Polygon with holes to KML', () => {
            const polygon: GmlPolygon = {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                    [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]],
                ],
                version: '3.2',
            };

            const kml = builder.buildPolygon(polygon);
            expect(kml).toContain('<outerBoundaryIs>');
            expect(kml).toContain('<innerBoundaryIs>');
            expect(kml).toContain('0,0 10,0 10,10 0,10 0,0');
            expect(kml).toContain('2,2 8,2 8,8 2,8 2,2');
        });

        it('should convert MultiPoint to KML MultiGeometry', () => {
            const multiPoint: GmlMultiPoint = {
                type: 'MultiPoint',
                coordinates: [[10, 20], [15, 25]],
                version: '3.2',
            };

            const kml = builder.buildMultiPoint(multiPoint);
            expect(kml).toContain('<MultiGeometry>');
            expect(kml).toContain('<Point><coordinates>10,20</coordinates></Point>');
            expect(kml).toContain('<Point><coordinates>15,25</coordinates></Point>');
            expect(kml).toContain('</MultiGeometry>');
        });
    });

    describe('Features', () => {
        it('should convert Feature to KML Placemark', () => {
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

            const kml = builder.buildFeature(feature);
            expect(kml).toContain('<Placemark>');
            expect(kml).toContain('<name>Test Point</name>');
            expect(kml).toContain('<description>');
            expect(kml).toContain('<table>');
            expect(kml).toContain('name');
            expect(kml).toContain('Test Point');
            expect(kml).toContain('value');
            expect(kml).toContain('42');
            expect(kml).toContain('<Point><coordinates>10,20</coordinates></Point>');
            expect(kml).toContain('</Placemark>');
        });

        it('should escape XML special characters in properties', () => {
            const feature: GmlFeature = {
                id: 'F1',
                geometry: {
                    type: 'Point',
                    coordinates: [10.0, 20.0],
                    version: '3.2',
                },
                properties: {
                    name: 'Test & <Special> "Characters"',
                },
                version: '3.2',
            };

            const kml = builder.buildFeature(feature);
            expect(kml).toContain('Test &amp; &lt;Special&gt; &quot;Characters&quot;');
        });

        it('should convert FeatureCollection to KML Document', () => {
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

            const kml = builder.buildFeatureCollection(featureCollection);
            expect(kml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(kml).toContain('<kml xmlns="http://www.opengis.net/kml/2.2">');
            expect(kml).toContain('<Document>');
            expect(kml).toContain('<name>GML Feature Collection</name>');
            expect(kml).toContain('<description>Converted from GML 3.2</description>');
            expect(kml).toContain('<name>Point 1</name>');
            expect(kml).toContain('<name>Point 2</name>');
            expect(kml).toContain('</Document>');
            expect(kml).toContain('</kml>');
        });
    });

    describe('Coverages', () => {
        it('should convert RectifiedGridCoverage to KML Placemark', () => {
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

            const kml = builder.buildRectifiedGridCoverage(coverage);
            expect(kml).toContain('<Placemark>');
            expect(kml).toContain('<name>COV1</name>');
            expect(kml).toContain('<description>');
            expect(kml).toContain('<![CDATA[');
            expect(kml).toContain('RectifiedGridCoverage');
            expect(kml).toContain('coverage.tif');
            expect(kml).toContain('red, green, blue');
            expect(kml).toContain('<Polygon>');
            expect(kml).toContain('1,1 10,1 10,20 1,20 1,1');
            expect(kml).toContain('</Placemark>');
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

            const kml = builder.buildRectifiedGridCoverage(coverage);
            expect(kml).toContain('<Placemark>');
            expect(kml).toContain('<name>COV1</name>');
            // Should not contain polygon geometry
            expect(kml).not.toContain('<Polygon>');
        });
    });

    describe('Envelope and Box', () => {
        it('should convert Envelope to KML Placemark with Polygon', () => {
            const envelope = {
                type: 'Envelope' as const,
                bbox: [10.0, 20.0, 30.0, 40.0] as [number, number, number, number],
                srsName: 'EPSG:4326',
                version: '3.2' as const,
            };

            const kml = builder.buildEnvelope(envelope);
            expect(kml).toContain('<Placemark>');
            expect(kml).toContain('<name>Envelope</name>');
            expect(kml).toContain('<Polygon>');
            expect(kml).toContain('10,20 30,20 30,40 10,40 10,20');
            expect(kml).toContain('</Placemark>');
        });
    });
});
