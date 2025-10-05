import { GeoJsonBuilder } from '../src/builders/geojson.js';
import {
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
    GmlFeature,
    GmlFeatureCollection,
} from '../src/types.js';

describe('GeoJsonBuilder', () => {
    const builder = new GeoJsonBuilder();

    it('builds GeoJSON Point from GML Point', () => {
        const gmlPoint: GmlPoint = {
            type: 'Point',
            coordinates: [10, 20],
            version: '3.2',
        };

        const result = builder.buildPoint(gmlPoint);
        expect(result).toEqual({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('builds GeoJSON LineString from GML LineString', () => {
        const gmlLineString: GmlLineString = {
            type: 'LineString',
            coordinates: [[0, 0], [10, 10]],
            version: '3.2',
        };

        const result = builder.buildLineString(gmlLineString);
        expect(result).toEqual({
            type: 'LineString',
            coordinates: [[0, 0], [10, 10]],
        });
    });

    it('builds GeoJSON Polygon from GML Polygon', () => {
        const gmlPolygon: GmlPolygon = {
            type: 'Polygon',
            coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
            version: '3.2',
        };

        const result = builder.buildPolygon(gmlPolygon);
        expect(result).toEqual({
            type: 'Polygon',
            coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        });
    });

    it('builds GeoJSON LineString from GML LinearRing', () => {
        const gmlLinearRing: GmlLinearRing = {
            type: 'LinearRing',
            coordinates: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            version: '3.2',
        };

        const result = builder.buildLinearRing(gmlLinearRing);
        expect(result).toEqual({
            type: 'LineString',
            coordinates: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        });
    });

    it('builds GeoJSON Feature with Polygon from GML Envelope', () => {
        const gmlEnvelope: GmlEnvelope = {
            type: 'Envelope',
            bbox: [0, 0, 10, 10],
            version: '3.2',
        };

        const result = builder.buildEnvelope(gmlEnvelope);
        expect(result).toEqual({
            type: 'Feature',
            bbox: [0, 0, 10, 10],
            properties: { type: 'Envelope' },
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                ],
            },
        });
    });

    it('builds GeoJSON Feature from GML Box', () => {
        const gmlBox: GmlBox = {
            type: 'Box',
            coordinates: [5, 5, 15, 15],
            version: '2.1.2',
        };

        const result = builder.buildBox(gmlBox);
        expect(result).toMatchObject({
            type: 'Feature',
            properties: { type: 'Envelope' },
        });
    });

    it('builds GeoJSON LineString from GML Curve', () => {
        const gmlCurve: GmlCurve = {
            type: 'Curve',
            coordinates: [[0, 0], [5, 5], [10, 10]],
            version: '3.2',
        };

        const result = builder.buildCurve(gmlCurve);
        expect(result).toEqual({
            type: 'LineString',
            coordinates: [[0, 0], [5, 5], [10, 10]],
        });
    });

    it('builds GeoJSON MultiPolygon from GML Surface', () => {
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
        expect(result).toEqual({
            type: 'MultiPolygon',
            coordinates: [
                [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
            ],
        });
    });

    it('builds GeoJSON MultiPoint from GML MultiPoint', () => {
        const gmlMultiPoint: GmlMultiPoint = {
            type: 'MultiPoint',
            coordinates: [[0, 0], [10, 10]],
            version: '3.2',
        };

        const result = builder.buildMultiPoint(gmlMultiPoint);
        expect(result).toEqual({
            type: 'MultiPoint',
            coordinates: [[0, 0], [10, 10]],
        });
    });

    it('builds GeoJSON MultiLineString from GML MultiLineString', () => {
        const gmlMultiLineString: GmlMultiLineString = {
            type: 'MultiLineString',
            coordinates: [
                [[0, 0], [10, 10]],
                [[20, 20], [30, 30]],
            ],
            version: '3.2',
        };

        const result = builder.buildMultiLineString(gmlMultiLineString);
        expect(result).toEqual({
            type: 'MultiLineString',
            coordinates: [
                [[0, 0], [10, 10]],
                [[20, 20], [30, 30]],
            ],
        });
    });

    it('builds GeoJSON MultiPolygon from GML MultiPolygon', () => {
        const gmlMultiPolygon: GmlMultiPolygon = {
            type: 'MultiPolygon',
            coordinates: [
                [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
            ],
            version: '3.2',
        };

        const result = builder.buildMultiPolygon(gmlMultiPolygon);
        expect(result).toEqual({
            type: 'MultiPolygon',
            coordinates: [
                [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
            ],
        });
    });

    it('builds GeoJSON Feature from GML Feature', () => {
        const gmlFeature: GmlFeature = {
            id: 'f1',
            geometry: {
                type: 'Point',
                coordinates: [10, 20],
                version: '3.2',
            },
            properties: { name: 'Test Point' },
            version: '3.2',
        };

        const result = builder.buildFeature(gmlFeature);
        expect(result).toEqual({
            type: 'Feature',
            id: 'f1',
            geometry: {
                type: 'Point',
                coordinates: [10, 20],
            },
            properties: { name: 'Test Point' },
        });
    });

    it('builds Feature with bbox when boundedBy is present', () => {
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
        expect(result).toMatchObject({
            type: 'Feature',
            bbox: [0, 0, 20, 20],
        });
    });

    it('builds Feature from GML Feature with Envelope geometry', () => {
        const gmlFeature: GmlFeature = {
            geometry: {
                type: 'Envelope',
                bbox: [0, 0, 10, 10],
                version: '3.2',
            },
            properties: { name: 'Bounds' },
            version: '3.2',
        };

        const result = builder.buildFeature(gmlFeature);
        expect(result.type).toBe('Feature');
        expect(result.properties).toMatchObject({
            type: 'Envelope',
            name: 'Bounds',
        });
    });

    it('builds GeoJSON FeatureCollection from GML FeatureCollection', () => {
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
        expect(result).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'f1',
                    geometry: { type: 'Point', coordinates: [10, 20] },
                    properties: { name: 'Point 1' },
                },
                {
                    type: 'Feature',
                    id: 'f2',
                    geometry: { type: 'Point', coordinates: [30, 40] },
                    properties: { name: 'Point 2' },
                },
            ],
        });
    });

    it('throws error for unsupported geometry type in buildGeometry', () => {
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

        expect(() => builder.buildFeature(feature)).toThrow('Unsupported geometry type: UnsupportedType');
    });

    it('builds all geometry types through buildGeometry', () => {
        const testCases = [
            { type: 'Point' as const, coordinates: [10, 20], version: '3.2' as const },
            { type: 'LineString' as const, coordinates: [[0, 0], [10, 10]], version: '3.2' as const },
            { type: 'Polygon' as const, coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]], version: '3.2' as const },
        ];

        testCases.forEach(gml => {
            const feature: GmlFeature = {
                geometry: gml,
                properties: {},
                version: '3.2',
            };
            const result = builder.buildFeature(feature);
            expect(result.type).toBe('Feature');
        });
    });

    it('builds LinearRing through buildGeometry', () => {
        const linearRing: GmlLinearRing = {
            type: 'LinearRing',
            coordinates: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            version: '3.2',
        };

        const feature: GmlFeature = {
            geometry: linearRing,
            properties: {},
            version: '3.2',
        };

        const result = builder.buildFeature(feature);
        expect(result.geometry.type).toBe('LineString');
    });

    it('builds Curve through buildGeometry', () => {
        const curve: GmlCurve = {
            type: 'Curve',
            coordinates: [[0, 0], [5, 5], [10, 10]],
            version: '3.2',
        };

        const feature: GmlFeature = {
            geometry: curve,
            properties: {},
            version: '3.2',
        };

        const result = builder.buildFeature(feature);
        expect(result.geometry.type).toBe('LineString');
    });

    it('builds Surface through buildGeometry', () => {
        const surface: GmlSurface = {
            type: 'Surface',
            patches: [
                {
                    type: 'Polygon',
                    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                    version: '3.2',
                },
            ],
            version: '3.2',
        };

        const feature: GmlFeature = {
            geometry: surface,
            properties: {},
            version: '3.2',
        };

        const result = builder.buildFeature(feature);
        expect(result.geometry.type).toBe('MultiPolygon');
    });

    it('builds MultiPoint through buildGeometry', () => {
        const multiPoint: GmlMultiPoint = {
            type: 'MultiPoint',
            coordinates: [[0, 0], [10, 10]],
            version: '3.2',
        };

        const feature: GmlFeature = {
            geometry: multiPoint,
            properties: {},
            version: '3.2',
        };

        const result = builder.buildFeature(feature);
        expect(result.geometry.type).toBe('MultiPoint');
    });

    it('builds MultiLineString through buildGeometry', () => {
        const multiLineString: GmlMultiLineString = {
            type: 'MultiLineString',
            coordinates: [[[0, 0], [10, 10]]],
            version: '3.2',
        };

        const feature: GmlFeature = {
            geometry: multiLineString,
            properties: {},
            version: '3.2',
        };

        const result = builder.buildFeature(feature);
        expect(result.geometry.type).toBe('MultiLineString');
    });

    it('builds MultiPolygon through buildGeometry', () => {
        const multiPolygon: GmlMultiPolygon = {
            type: 'MultiPolygon',
            coordinates: [[[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]],
            version: '3.2',
        };

        const feature: GmlFeature = {
            geometry: multiPolygon,
            properties: {},
            version: '3.2',
        };

        const result = builder.buildFeature(feature);
        expect(result.geometry.type).toBe('MultiPolygon');
    });
});
