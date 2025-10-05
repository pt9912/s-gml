import { parseXml, detectGmlVersion, parseCoordinates } from '../src/utils.js';

describe('utils', () => {
    it('parses XML to JS object', async () => {
        const xml = '<root><value>1</value></root>';
        const doc = await parseXml(xml);
        expect(doc.root.value).toBe('1');
    });

    it('detects GML 3.2 version at root', async () => {
        const doc = await parseXml('<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2"/>');
        expect(detectGmlVersion(doc)).toBe('3.2');
    });

    it('detects GML version nested inside WFS', async () => {
        const xml = `
            <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:featureMember/>
            </wfs:FeatureCollection>
        `;
        const doc = await parseXml(xml);
        expect(detectGmlVersion(doc)).toBe('3.2');
    });

    it('throws when no namespace is present', () => {
        expect(() => detectGmlVersion({})).toThrow('No GML namespace found');
    });

    it('parses 2.1.2 coordinates', () => {
        expect(parseCoordinates('10,20 30,40', '2.1.2', 2)).toEqual([
            [10, 20],
            [30, 40],
        ]);
    });

    it('parses 3.2 coordinates with dimension', () => {
        expect(parseCoordinates('10 20 30 40 50 60', '3.2', 3)).toEqual([
            [10, 20, 30],
            [40, 50, 60],
        ]);
    });
});
