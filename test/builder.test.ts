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

    it('builds Point', () => {
        const point: GmlPoint = { type: 'Point', coordinates: [1, 2], version: '3.2' };
        expect(builder.buildPoint(point)).toEqual({ type: 'Point', coordinates: [1, 2] });
    });

    it('builds LineString', () => {
        const line: GmlLineString = { type: 'LineString', coordinates: [[1, 2], [3, 4]], version: '3.2' };
        expect(builder.buildLineString(line)).toEqual({ type: 'LineString', coordinates: [[1, 2], [3, 4]] });
    });

    it('builds Polygon', () => {
        const polygon: GmlPolygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]], version: '3.2' };
        expect(builder.buildPolygon(polygon)).toEqual({ type: 'Polygon', coordinates: polygon.coordinates });
    });

    it('builds MultiPoint', () => {
        const multiPoint: GmlMultiPoint = { type: 'MultiPoint', coordinates: [[1, 2], [3, 4]], version: '3.2' };
        expect(builder.buildMultiPoint(multiPoint)).toEqual({ type: 'MultiPoint', coordinates: multiPoint.coordinates });
    });

    it('builds MultiLineString', () => {
        const multiLine: GmlMultiLineString = { type: 'MultiLineString', coordinates: [[[1, 2], [3, 4]]], version: '3.2' };
        expect(builder.buildMultiLineString(multiLine)).toEqual({ type: 'MultiLineString', coordinates: multiLine.coordinates });
    });

    it('builds MultiPolygon', () => {
        const multiPolygon: GmlMultiPolygon = { type: 'MultiPolygon', coordinates: [[[[0, 0]]]], version: '3.2' };
        expect(builder.buildMultiPolygon(multiPolygon)).toEqual({ type: 'MultiPolygon', coordinates: multiPolygon.coordinates });
    });

    it('builds LinearRing', () => {
        const ring: GmlLinearRing = { type: 'LinearRing', coordinates: [[0, 0], [1, 1]], version: '3.2' };
        expect(builder.buildLinearRing(ring)).toEqual({ type: 'LineString', coordinates: ring.coordinates });
    });

    it('builds Envelope feature', () => {
        const envelope: GmlEnvelope = { type: 'Envelope', bbox: [0, 0, 10, 10], version: '3.2' };
        const feature = builder.buildEnvelope(envelope);
        expect(feature.type).toBe('Feature');
        expect(feature.bbox).toEqual([0, 0, 10, 10]);
    });

    it('builds Box via Envelope', () => {
        const box: GmlBox = { type: 'Box', coordinates: [0, 0, 5, 5], version: '3.2' };
        const feature = builder.buildBox(box);
        expect(feature.type).toBe('Feature');
        expect(feature.bbox).toEqual([0, 0, 5, 5]);
    });

    it('builds Curve', () => {
        const curve: GmlCurve = { type: 'Curve', coordinates: [[1, 2], [3, 4]], version: '3.2' };
        expect(builder.buildCurve(curve)).toEqual({ type: 'LineString', coordinates: curve.coordinates });
    });

    it('builds Surface', () => {
        const surface: GmlSurface = {
            type: 'Surface',
            patches: [{ type: 'Polygon', coordinates: [[[0, 0]]], version: '3.2' }],
            version: '3.2',
        };
        expect(builder.buildSurface(surface)).toEqual({ type: 'MultiPolygon', coordinates: [[[[0, 0]]]] });
    });

    it('builds Feature with geometry and bbox', () => {
        const feature: GmlFeature = {
            id: 'f1',
            geometry: { type: 'Point', coordinates: [1, 2], version: '3.2' },
            properties: { foo: 'bar' },
            version: '3.2',
            boundedBy: { type: 'Envelope', bbox: [0, 0, 1, 1], version: '3.2' },
        };

        const geojson = builder.buildFeature(feature);
        expect(geojson).toMatchObject({ id: 'f1', properties: { foo: 'bar' }, bbox: [0, 0, 1, 1] });
    });

    it('builds FeatureCollection', () => {
        const collection: GmlFeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    geometry: { type: 'Point', coordinates: [0, 0], version: '3.2' },
                    properties: {},
                    version: '3.2',
                },
            ],
            version: '3.2',
        };

        const geojson = builder.buildFeatureCollection(collection);
        expect(geojson.type).toBe('FeatureCollection');
        expect(geojson.features).toHaveLength(1);
    });
});
