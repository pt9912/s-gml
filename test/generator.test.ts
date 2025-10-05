import { generateGml } from '../src/generator.js';
import {
    GmlFeature,
    GmlFeatureCollection,
    GmlPoint,
    GmlPolygon,
    GmlLineString,
    GmlLinearRing,
    GmlBox,
    GmlCurve,
    GmlSurface,
    GmlMultiPoint,
    GmlMultiLineString,
    GmlMultiPolygon
} from '../src/types.js';

describe('generateGml', () => {
    it('serializes a feature with boundedBy to GML', () => {
        const point: GmlPoint = {
            type: 'Point',
            coordinates: [10, 20],
            srsName: 'EPSG:4326',
            version: '3.2',
        };

        const feature: GmlFeature = {
            id: 'f1',
            geometry: point,
            properties: { name: 'Test' },
            version: '3.2',
            boundedBy: {
                type: 'Envelope',
                bbox: [0, 0, 20, 20],
                version: '3.2',
            },
        };

        const xml = generateGml(feature, '3.2', true);

        expect(xml).toContain('<gml:boundedBy>');
        expect(xml).toContain('gml:id="f1"');
        expect(xml).toContain('<gml:pos>10 20</gml:pos>');
    });

    it('serializes a feature collection to GML', () => {
        const polygon: GmlPolygon = {
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
            version: '3.2',
        };

        const featureCollection: GmlFeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    geometry: polygon,
                    properties: {},
                    version: '3.2',
                },
            ],
            version: '3.2',
            bounds: {
                type: 'Envelope',
                bbox: [0, 0, 10, 10],
                version: '3.2',
            },
        };

        const xml = generateGml(featureCollection, '3.2', true);

        expect(xml).toContain('<gml:FeatureCollection');
        expect(xml).toContain('<gml:boundedBy>');
        expect(xml).toContain('<gml:Polygon');
    });

    it('serializes LineString in GML 3.2', () => {
        const lineString: GmlLineString = {
            type: 'LineString',
            coordinates: [[0, 0], [10, 10]],
            version: '3.2',
        };

        const xml = generateGml(lineString, '3.2');
        expect(xml).toContain('<gml:LineString');
        expect(xml).toContain('<gml:posList>0 0 10 10</gml:posList>');
    });

    it('serializes LineString in GML 2.1.2', () => {
        const lineString: GmlLineString = {
            type: 'LineString',
            coordinates: [[0, 0], [10, 10]],
            version: '2.1.2',
        };

        const xml = generateGml(lineString, '2.1.2');
        expect(xml).toContain('<gml:LineString');
        expect(xml).toContain('<gml:coordinates>0,0 10,10</gml:coordinates>');
    });

    it('serializes LinearRing', () => {
        const ring: GmlLinearRing = {
            type: 'LinearRing',
            coordinates: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            version: '3.2',
        };

        const xml = generateGml(ring, '3.2');
        expect(xml).toContain('<gml:LinearRing');
        expect(xml).toContain('<gml:posList>');
    });

    it('serializes Polygon with interior rings', () => {
        const polygon: GmlPolygon = {
            type: 'Polygon',
            coordinates: [
                [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                [[5, 5], [15, 5], [15, 15], [5, 15], [5, 5]],
            ],
            version: '3.2',
        };

        const xml = generateGml(polygon, '3.2');
        expect(xml).toContain('<gml:exterior>');
        expect(xml).toContain('<gml:interior>');
    });

    it('throws error for invalid polygon without exterior', () => {
        const polygon: GmlPolygon = {
            type: 'Polygon',
            coordinates: [],
            version: '3.2',
        };

        expect(() => generateGml(polygon, '3.2')).toThrow('Invalid polygon: missing exterior ring');
    });

    it('serializes Box in GML 2.1.2', () => {
        const box: GmlBox = {
            type: 'Box',
            coordinates: [0, 0, 10, 10],
            version: '2.1.2',
        };

        const xml = generateGml(box, '2.1.2');
        expect(xml).toContain('<gml:Box');
        expect(xml).toContain('0,0 10,10');
    });

    it('serializes Box in GML 3.2', () => {
        const box: GmlBox = {
            type: 'Box',
            coordinates: [0, 0, 10, 10],
            version: '3.2',
        };

        const xml = generateGml(box, '3.2');
        expect(xml).toContain('<gml:Box');
        expect(xml).toContain('0 0 10 10');
    });

    it('serializes Curve', () => {
        const curve: GmlCurve = {
            type: 'Curve',
            coordinates: [[0, 0], [5, 5], [10, 10]],
            version: '3.2',
        };

        const xml = generateGml(curve, '3.2');
        expect(xml).toContain('<gml:Curve');
        expect(xml).toContain('<gml:segments>');
        expect(xml).toContain('<gml:LineStringSegment>');
    });

    it('serializes Surface with patches', () => {
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

        const xml = generateGml(surface, '3.2');
        expect(xml).toContain('<gml:Surface');
        expect(xml).toContain('<gml:patches>');
        expect(xml).toContain('<gml:PolygonPatch>');
    });

    it('serializes MultiPoint', () => {
        const multiPoint: GmlMultiPoint = {
            type: 'MultiPoint',
            coordinates: [[0, 0], [10, 10]],
            version: '3.2',
        };

        const xml = generateGml(multiPoint, '3.2');
        expect(xml).toContain('<gml:MultiPoint');
        expect(xml).toContain('<gml:pointMember>');
    });

    it('serializes MultiLineString', () => {
        const multiLineString: GmlMultiLineString = {
            type: 'MultiLineString',
            coordinates: [
                [[0, 0], [10, 10]],
                [[20, 20], [30, 30]],
            ],
            version: '3.2',
        };

        const xml = generateGml(multiLineString, '3.2');
        expect(xml).toContain('<gml:MultiLineString');
        expect(xml).toContain('<gml:lineStringMember>');
    });

    it('serializes MultiPolygon', () => {
        const multiPolygon: GmlMultiPolygon = {
            type: 'MultiPolygon',
            coordinates: [
                [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
                [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
            ],
            version: '3.2',
        };

        const xml = generateGml(multiPolygon, '3.2');
        expect(xml).toContain('<gml:MultiPolygon');
        expect(xml).toContain('<gml:polygonMember>');
    });

    it('serializes feature with various property types', () => {
        const feature: GmlFeature = {
            geometry: { type: 'Point', coordinates: [0, 0], version: '3.2' },
            properties: {
                string: 'value',
                number: 42,
                null: null,
                undefined: undefined,
                object: { key: 'value' },
            },
            version: '3.2',
        };

        const xml = generateGml(feature, '3.2');
        expect(xml).toContain('<string>value</string>');
        expect(xml).toContain('<number>42</number>');
        expect(xml).toContain('<null></null>');
        expect(xml).toContain('<undefined></undefined>');
        expect(xml).toContain('<object>{"key":"value"}</object>');
    });

    it('throws for unsupported geometry type', () => {
        const unsupported = {
            type: 'UnsupportedType' as any,
            coordinates: [],
            version: '3.2' as const,
        };

        expect(() => generateGml(unsupported, '3.2')).toThrow('Unsupported GML type');
    });
});
