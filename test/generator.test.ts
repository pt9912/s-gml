import { generateGml } from '../src/generator.js';
import { GmlFeature, GmlFeatureCollection, GmlPoint, GmlPolygon } from '../src/types.js';

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
});
