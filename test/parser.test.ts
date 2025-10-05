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

    it('parses WFS FeatureCollection with nested feature geometry', async () => {
        const parser = new GmlParser();
        const gml = `
            <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <gml:featureMember>
                    <my:Building gml:id="b1">
                        <my:name>Rathaus</my:name>
                        <gml:location>
                            <gml:Point srsName="EPSG:4326">
                                <gml:pos>10 20</gml:pos>
                            </gml:Point>
                        </gml:location>
                    </my:Building>
                </gml:featureMember>
            </wfs:FeatureCollection>
        `;

        const result = await parser.parse(gml);

        expect(result).toMatchObject({ type: 'FeatureCollection' });
        const collection = result as any;
        expect(collection.features).toHaveLength(1);
        expect(collection.features[0].id).toBe('b1');
        expect(collection.features[0].properties).toHaveProperty('my:name', 'Rathaus');
        expect(collection.features[0].geometry).toEqual({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('parses MultiSurface to MultiPolygon', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
                <gml:surfaceMember>
                    <gml:Surface>
                        <gml:patches>
                            <gml:PolygonPatch>
                                <gml:exterior>
                                    <gml:LinearRing>
                                        <gml:posList>10 20 30 20 30 40 10 40 10 20</gml:posList>
                                    </gml:LinearRing>
                                </gml:exterior>
                            </gml:PolygonPatch>
                        </gml:patches>
                    </gml:Surface>
                </gml:surfaceMember>
                <gml:surfaceMember>
                    <gml:Polygon>
                        <gml:exterior>
                            <gml:LinearRing>
                                <gml:posList>50 60 60 60 60 70 50 70 50 60</gml:posList>
                            </gml:LinearRing>
                        </gml:exterior>
                    </gml:Polygon>
                </gml:surfaceMember>
            </gml:MultiSurface>
        `;

        const result = await parser.parse(gml);

        expect(result).toEqual({
            type: 'MultiPolygon',
            coordinates: [
                [
                    [
                        [10, 20],
                        [30, 20],
                        [30, 40],
                        [10, 40],
                        [10, 20],
                    ],
                ],
                [
                    [
                        [50, 60],
                        [60, 60],
                        [60, 70],
                        [50, 70],
                        [50, 60],
                    ],
                ],
            ],
        });
    });

    it('parses GML Curve with segments', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Curve xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:segments>
                    <gml:LineStringSegment>
                        <gml:posList>10 20 15 25 20 30</gml:posList>
                    </gml:LineStringSegment>
                </gml:segments>
            </gml:Curve>
        `;

        const result = await parser.parse(gml);

        expect(result).toEqual({
            type: 'LineString',
            coordinates: [
                [10, 20],
                [15, 25],
                [20, 30],
            ],
        });
    });

    it('parses GML MultiPoint 2.1.2 coordinates', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiPoint xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:4326">
                <gml:coordinates>10,20 30,40</gml:coordinates>
            </gml:MultiPoint>
        `;

        const result = await parser.parse(gml);

        expect(result).toEqual({
            type: 'MultiPoint',
            coordinates: [
                [10, 20],
                [30, 40],
            ],
        });
    });

    it('parses FeatureCollection with boundedBy envelope', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:boundedBy>
                    <gml:Envelope srsName="EPSG:4326">
                        <gml:lowerCorner>0 0</gml:lowerCorner>
                        <gml:upperCorner>10 10</gml:upperCorner>
                    </gml:Envelope>
                </gml:boundedBy>
                <gml:featureMember>
                    <my:PointFeature xmlns:my="https://example.com/my" gml:id="p1">
                        <my:name>Test</my:name>
                        <gml:Point srsName="EPSG:4326">
                            <gml:pos>5 6</gml:pos>
                        </gml:Point>
                    </my:PointFeature>
                </gml:featureMember>
            </gml:FeatureCollection>
        `;

        const result = await parser.parse(gml);
        const collection = result as any;

        expect(collection.type).toBe('FeatureCollection');
        expect(collection.features).toHaveLength(1);
        expect(collection.bbox).toEqual([0, 0, 10, 10]);
        expect(collection.features[0].properties).toHaveProperty('my:name', 'Test');
    });
});
