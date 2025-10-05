import { GmlParser } from '../src/index.js';

describe('GmlParser.convert', () => {
    it('converts GML 2.1.2 Point to GML 3.2', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:4326">
                <gml:coordinates>10,20</gml:coordinates>
            </gml:Point>
        `;

        const converted = await parser.convert(gml, { outputVersion: '3.2', prettyPrint: true });

        expect(converted).toContain('<gml:Point');
        expect(converted).toContain('<gml:pos>10 20</gml:pos>');
        expect(converted).toContain('xmlns:gml="http://www.opengis.net/gml/3.2"');
    });
});
