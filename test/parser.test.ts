import { GmlParser } from '../src/index.js';

describe('GmlParser.parse', () => {
    it('converts GML Point to GeoJSON Point', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
                <gml:pos>10 20</gml:pos>
            </gml:Point>
        `;

        const result = await parser.parse(gml);

        expect(result).toEqual({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('parses GML Envelope to feature with bbox', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Envelope xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
                <gml:lowerCorner>10 20</gml:lowerCorner>
                <gml:upperCorner>30 40</gml:upperCorner>
            </gml:Envelope>
        `;

        const feature = await parser.parse(gml);

        expect(feature).toEqual({
            type: 'Feature',
            bbox: [10, 20, 30, 40],
            properties: { type: 'Envelope' },
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [10, 20],
                        [30, 20],
                        [30, 40],
                        [10, 40],
                        [10, 20],
                    ],
                ],
            },
        });
    });
});
