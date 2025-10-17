import { CisJsonBuilder } from '../../src/builders/cis-json.js';
import { GmlParser } from '../../src/parser.js';
import type {
    GmlPoint,
    GmlLineString,
    GmlPolygon,
    GmlLinearRing,
    GmlEnvelope,
    GmlBox,
    GmlCurve,
    GmlSurface,
    GmlMultiPoint,
    GmlMultiLineString,
    GmlMultiPolygon,
    GmlRectifiedGridCoverage,
    GmlGridCoverage,
    GmlReferenceableGridCoverage,
    GmlMultiPointCoverage,
    GmlFeature,
    GmlFeatureCollection,
} from '../../src/types.js';

describe('CisJsonBuilder', () => {
    const builder = new CisJsonBuilder();

    describe('Basic Geometries', () => {
        it('should build Point', () => {
            const gmlPoint: GmlPoint = {
                type: 'Point',
                coordinates: [10, 20],
                srsName: 'EPSG:4326',
                version: '3.2',
            };

            const result = builder.buildPoint(gmlPoint);
            expect(result).toEqual({
                type: 'Point',
                pos: [10, 20],
                srsName: 'EPSG:4326',
            });
        });

        it('should build LineString', () => {
            const gmlLineString: GmlLineString = {
                type: 'LineString',
                coordinates: [[0, 0], [10, 10], [20, 20]],
                srsName: 'EPSG:4326',
                version: '3.2',
            };

            const result = builder.buildLineString(gmlLineString);
            expect(result).toEqual({
                type: 'LineString',
                posList: [0, 0, 10, 10, 20, 20],
                srsName: 'EPSG:4326',
            });
        });

        it('should build Polygon', () => {
            const gmlPolygon: GmlPolygon = {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                ],
                srsName: 'EPSG:4326',
                version: '3.2',
            };

            const result = builder.buildPolygon(gmlPolygon);
            expect(result.type).toBe('Polygon');
            expect(result.exterior).toEqual([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]);
            expect(result.interior).toEqual([]);
        });

        it('should build Polygon with holes', () => {
            const gmlPolygon: GmlPolygon = {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                    [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]],
                ],
                version: '3.2',
            };

            const result = builder.buildPolygon(gmlPolygon);
            expect(result.exterior).toEqual([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]);
            expect(result.interior).toHaveLength(1);
        });

        it('should build LinearRing', () => {
            const gmlLinearRing: GmlLinearRing = {
                type: 'LinearRing',
                coordinates: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                version: '3.2',
            };

            const result = builder.buildLinearRing(gmlLinearRing);
            expect(result.type).toBe('LinearRing');
            expect(result.posList).toEqual([0, 0, 10, 0, 10, 10, 0, 10, 0, 0]);
        });
    });

    describe('Multi-Geometries', () => {
        it('should build MultiPoint', () => {
            const gmlMultiPoint: GmlMultiPoint = {
                type: 'MultiPoint',
                coordinates: [[0, 0], [10, 10], [20, 20]],
                version: '3.2',
            };

            const result = builder.buildMultiPoint(gmlMultiPoint);
            expect(result.type).toBe('MultiPoint');
            expect(result.pointMember).toHaveLength(3);
            expect(result.pointMember[0]).toEqual({ Point: { pos: [0, 0] } });
        });

        it('should build MultiLineString', () => {
            const gmlMultiLineString: GmlMultiLineString = {
                type: 'MultiLineString',
                coordinates: [
                    [[0, 0], [10, 10]],
                    [[20, 20], [30, 30]],
                ],
                version: '3.2',
            };

            const result = builder.buildMultiLineString(gmlMultiLineString);
            expect(result.type).toBe('MultiLineString');
            expect(result.lineStringMember).toHaveLength(2);
        });

        it('should build MultiPolygon', () => {
            const gmlMultiPolygon: GmlMultiPolygon = {
                type: 'MultiPolygon',
                coordinates: [
                    [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                    [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
                ],
                version: '3.2',
            };

            const result = builder.buildMultiPolygon(gmlMultiPolygon);
            expect(result.type).toBe('MultiPolygon');
            expect(result.polygonMember).toHaveLength(2);
        });
    });

    describe('Envelope and Box', () => {
        it('should build Envelope', () => {
            const gmlEnvelope: GmlEnvelope = {
                type: 'Envelope',
                bbox: [0, 0, 10, 10],
                srsName: 'EPSG:4326',
                version: '3.2',
            };

            const result = builder.buildEnvelope(gmlEnvelope);
            expect(result.type).toBe('Envelope');
            expect(result.lowerCorner).toEqual([0, 0]);
            expect(result.upperCorner).toEqual([10, 10]);
        });

        it('should build Box', () => {
            const gmlBox: GmlBox = {
                type: 'Box',
                coordinates: [5, 5, 15, 15],
                version: '2.1.2',
            };

            const result = builder.buildBox(gmlBox);
            expect(result.type).toBe('Box');
            expect(result.coordinates).toEqual([5, 5, 15, 15]);
        });
    });

    describe('Curve and Surface', () => {
        it('should build Curve', () => {
            const gmlCurve: GmlCurve = {
                type: 'Curve',
                coordinates: [[0, 0], [5, 5], [10, 10]],
                version: '3.2',
            };

            const result = builder.buildCurve(gmlCurve);
            expect(result.type).toBe('Curve');
            expect(result.segments.LineStringSegment.posList).toEqual([0, 0, 5, 5, 10, 10]);
        });

        it('should build Surface', () => {
            const gmlSurface: GmlSurface = {
                type: 'Surface',
                patches: [
                    {
                        type: 'Polygon',
                        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                        version: '3.2',
                    },
                    {
                        type: 'Polygon',
                        coordinates: [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
                        version: '3.2',
                    },
                ],
                version: '3.2',
            };

            const result = builder.buildSurface(gmlSurface);
            expect(result.type).toBe('Surface');
            expect(result.patches).toHaveLength(2);
            expect(result.patches[0]).toHaveProperty('PolygonPatch');
        });
    });

    describe('Coverage Types', () => {
        it('should build RectifiedGridCoverage', () => {
            const gmlCoverage: GmlRectifiedGridCoverage = {
                type: 'RectifiedGridCoverage',
                id: 'coverage1',
                version: '3.2',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [0, 0, 100, 100],
                    version: '3.2',
                },
                domainSet: {
                    id: 'grid1',
                    srsName: 'EPSG:4326',
                    dimension: 2,
                    axisLabels: ['x', 'y'],
                    limits: {
                        low: [0, 0],
                        high: [10, 10],
                    },
                    origin: [0, 0],
                    offsetVectors: [[1, 0], [0, 1]],
                },
                rangeType: {
                    field: [
                        {
                            name: 'temperature',
                            description: 'Temperature in Celsius',
                            uom: 'Cel',
                            dataType: 'float',
                        },
                    ],
                },
                rangeSet: {
                    file: {
                        fileName: 'data.tif',
                        fileStructure: 'GeoTIFF',
                    },
                },
            };

            const result = builder.buildRectifiedGridCoverage(gmlCoverage);
            expect(result['@context']).toBe('http://www.opengis.net/cis/1.1/json');
            expect(result.type).toBe('CoverageByDomainAndRangeType');
            expect(result.id).toBe('coverage1');
            expect(result.domainSet.type).toBe('GeneralGrid');
            expect(result.rangeType.field).toHaveLength(1);
        });

        it('should build GridCoverage', () => {
            const gmlCoverage: GmlGridCoverage = {
                type: 'GridCoverage',
                id: 'grid1',
                version: '3.2',
                domainSet: {
                    id: 'grid_domain',
                    dimension: 2,
                    axisLabels: ['x', 'y'],
                    limits: {
                        low: [0, 0],
                        high: [100, 100],
                    },
                },
                rangeType: {
                    field: [
                        {
                            name: 'elevation',
                            description: 'Elevation in meters',
                            uom: 'm',
                            dataType: 'float',
                        },
                    ],
                },
                rangeSet: {
                    file: {
                        fileName: 'elevation.tif',
                        fileStructure: 'GeoTIFF',
                    },
                },
            };

            const result = builder.buildGridCoverage(gmlCoverage);
            expect(result.type).toBe('CoverageByDomainAndRangeType');
            expect(result.domainSet.type).toBe('Grid');
        });

        it('should build MultiPointCoverage', () => {
            const gmlCoverage: GmlMultiPointCoverage = {
                type: 'MultiPointCoverage',
                id: 'stations',
                version: '3.2',
                domainSet: {
                    type: 'MultiPoint',
                    coordinates: [[10, 20], [30, 40], [50, 60]],
                    version: '3.2',
                },
                rangeType: {
                    field: [
                        {
                            name: 'temperature',
                            description: 'Temperature',
                            uom: 'Cel',
                            dataType: 'float',
                        },
                    ],
                },
                rangeSet: {
                    file: {
                        fileName: 'stations.csv',
                        fileStructure: 'CSV',
                    },
                },
            };

            const result = builder.buildMultiPointCoverage(gmlCoverage);
            expect(result.type).toBe('CoverageByDomainAndRangeType');
            expect(result.domainSet.type).toBe('MultiPoint');
        });

        it('should build ReferenceableGridCoverage', () => {
            const gmlCoverage: GmlReferenceableGridCoverage = {
                type: 'ReferenceableGridCoverage',
                id: 'ref_grid',
                version: '3.2',
                domainSet: {
                    id: 'ref_domain',
                    dimension: 2,
                    axisLabels: ['x', 'y'],
                    limits: {
                        low: [0, 0],
                        high: [50, 50],
                    },
                },
                rangeType: {
                    field: [],
                },
                rangeSet: {
                    file: {
                        fileName: 'data.nc',
                        fileStructure: 'NetCDF',
                    },
                },
            };

            const result = builder.buildReferenceableGridCoverage(gmlCoverage);
            expect(result).toBeDefined();
            expect(result.type).toBe('CoverageByDomainAndRangeType');
        });
    });

    describe('Features', () => {
        it('should build Feature', () => {
            const gmlFeature: GmlFeature = {
                id: 'f1',
                geometry: {
                    type: 'Point',
                    coordinates: [10, 20],
                    version: '3.2',
                },
                properties: { name: 'Test Point', value: 42 },
                version: '3.2',
            };

            const result = builder.buildFeature(gmlFeature);
            expect(result.type).toBe('Feature');
            expect(result.id).toBe('f1');
            expect(result.properties).toEqual({ name: 'Test Point', value: 42 });
        });

        it('should build Feature with boundedBy', () => {
            const gmlFeature: GmlFeature = {
                geometry: {
                    type: 'Point',
                    coordinates: [10, 20],
                    version: '3.2',
                },
                properties: {},
                boundedBy: {
                    type: 'Envelope',
                    bbox: [0, 0, 20, 20],
                    version: '3.2',
                },
                version: '3.2',
            };

            const result = builder.buildFeature(gmlFeature);
            expect(result.boundedBy).toBeDefined();
            expect(result.boundedBy.type).toBe('Envelope');
        });

        it('should build FeatureCollection', () => {
            const gmlFeatureCollection: GmlFeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        id: 'f1',
                        geometry: {
                            type: 'Point',
                            coordinates: [10, 20],
                            version: '3.2',
                        },
                        properties: { name: 'Point 1' },
                        version: '3.2',
                    },
                    {
                        id: 'f2',
                        geometry: {
                            type: 'Point',
                            coordinates: [30, 40],
                            version: '3.2',
                        },
                        properties: { name: 'Point 2' },
                        version: '3.2',
                    },
                ],
                version: '3.2',
            };

            const result = builder.buildFeatureCollection(gmlFeatureCollection);
            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toHaveLength(2);
        });
    });

    describe('Builder Integration', () => {
        it('should work as a builder with GmlParser', async () => {
            const gml = `
                <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                    <gml:pos>10 20</gml:pos>
                </gml:Point>
            `;

            const parser = new GmlParser(new CisJsonBuilder());
            const result = await parser.parse(gml);

            expect(result).toBeDefined();
            expect(result.type).toBe('Point');
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

            const parser = new GmlParser(new CisJsonBuilder());
            const result = await parser.parse(gml) as any;

            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toHaveLength(1);
        });
    });

    describe('Error Handling', () => {
        it('should throw error for unsupported geometry type', () => {
            const unsupportedGml = {
                type: 'UnsupportedType' as any,
                coordinates: [],
                version: '3.2' as const,
            };

            const feature: GmlFeature = {
                geometry: unsupportedGml,
                properties: {},
                version: '3.2',
            };

            expect(() => builder.buildFeature(feature)).toThrow('Unsupported geometry type');
        });
    });
});
