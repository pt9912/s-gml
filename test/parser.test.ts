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

    it('parses GML 2.1.2 Point with coordinates tag', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:4326">
                <gml:coordinates>10,20</gml:coordinates>
            </gml:Point>
        `;

        const result = await parser.parse(gml);
        expect(result).toEqual({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('parses GML 2.1.2 Polygon with outerBoundaryIs', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Polygon xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:4326">
                <gml:outerBoundaryIs>
                    <gml:LinearRing>
                        <gml:coordinates>0,0 10,0 10,10 0,10 0,0</gml:coordinates>
                    </gml:LinearRing>
                </gml:outerBoundaryIs>
            </gml:Polygon>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Polygon',
            coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        });
    });

    it('parses GML 2.1.2 Polygon with inner boundary', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Polygon xmlns:gml="http://www.opengis.net/gml">
                <gml:outerBoundaryIs>
                    <gml:LinearRing>
                        <gml:coordinates>0,0 20,0 20,20 0,20 0,0</gml:coordinates>
                    </gml:LinearRing>
                </gml:outerBoundaryIs>
                <gml:innerBoundaryIs>
                    <gml:LinearRing>
                        <gml:coordinates>5,5 15,5 15,15 5,15 5,5</gml:coordinates>
                    </gml:LinearRing>
                </gml:innerBoundaryIs>
            </gml:Polygon>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Polygon',
            coordinates: [
                [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                [[5, 5], [15, 5], [15, 15], [5, 15], [5, 5]],
            ],
        });
    });

    it('parses GML Box', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Box xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:4326">
                <gml:coordinates>0 0 10 10</gml:coordinates>
            </gml:Box>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Feature',
            properties: { type: 'Envelope' },
        });
    });

    it('parses Surface with PolygonPatch', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Surface xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:patches>
                    <gml:PolygonPatch>
                        <gml:exterior>
                            <gml:LinearRing>
                                <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
                            </gml:LinearRing>
                        </gml:exterior>
                    </gml:PolygonPatch>
                </gml:patches>
            </gml:Surface>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiPolygon',
            coordinates: [[[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]],
        });
    });

    it('parses MultiPoint with pointMembers container', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiPoint xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pointMembers>
                    <gml:Point><gml:pos>0 0</gml:pos></gml:Point>
                    <gml:Point><gml:pos>10 10</gml:pos></gml:Point>
                </gml:pointMembers>
            </gml:MultiPoint>
        `;

        const result = await parser.parse(gml);
        expect(result).toEqual({
            type: 'MultiPoint',
            coordinates: [[0, 0], [10, 10]],
        });
    });

    it('parses MultiLineString with lineStringMembers container', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiLineString xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:lineStringMembers>
                    <gml:LineString><gml:posList>0 0 10 10</gml:posList></gml:LineString>
                </gml:lineStringMembers>
            </gml:MultiLineString>
        `;

        const result = await parser.parse(gml);
        expect(result).toEqual({
            type: 'MultiLineString',
            coordinates: [[[0, 0], [10, 10]]],
        });
    });

    it('parses MultiPolygon with polygonMembers container', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:polygonMembers>
                    <gml:Polygon>
                        <gml:exterior>
                            <gml:LinearRing>
                                <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
                            </gml:LinearRing>
                        </gml:exterior>
                    </gml:Polygon>
                </gml:polygonMembers>
            </gml:MultiPolygon>
        `;

        const result = await parser.parse(gml);
        expect(result).toEqual({
            type: 'MultiPolygon',
            coordinates: [[[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]],
        });
    });

    it('parses MultiSurface with surfaceMembers container', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:surfaceMembers>
                    <gml:Surface>
                        <gml:patches>
                            <gml:PolygonPatch>
                                <gml:exterior>
                                    <gml:LinearRing>
                                        <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
                                    </gml:LinearRing>
                                </gml:exterior>
                            </gml:PolygonPatch>
                        </gml:patches>
                    </gml:Surface>
                    <gml:Polygon>
                        <gml:exterior>
                            <gml:LinearRing>
                                <gml:posList>20 20 30 20 30 30 20 30 20 20</gml:posList>
                            </gml:LinearRing>
                        </gml:exterior>
                    </gml:Polygon>
                </gml:surfaceMembers>
            </gml:MultiSurface>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiPolygon',
        });
    });

    it('parses 3D coordinates with srsDimension', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" srsDimension="3">
                <gml:pos>10 20 30</gml:pos>
            </gml:Point>
        `;

        const result = await parser.parse(gml);
        expect(result).toEqual({
            type: 'Point',
            coordinates: [10, 20, 30],
        });
    });

    it('throws error for invalid GML Point', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
            </gml:Point>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Point');
    });

    it('throws error when no geometry found', async () => {
        const parser = new GmlParser();
        const gml = `<root xmlns:gml="http://www.opengis.net/gml/3.2"></root>`;

        await expect(parser.parse(gml)).rejects.toThrow('No GML geometry found');
    });

    it('throws error for unsupported GML element', async () => {
        const parser = new GmlParser();
        const gml = `<gml:UnsupportedElement xmlns:gml="http://www.opengis.net/gml/3.2"></gml:UnsupportedElement>`;

        await expect(parser.parse(gml)).rejects.toThrow('Unsupported GML element');
    });

    it('converts GML geometry using convertGeometry', async () => {
        const parser = new GmlParser();
        const gmlObject = {
            type: 'Point' as const,
            coordinates: [10, 20],
            version: '3.2' as const,
        };

        const result = await parser.convertGeometry(gmlObject, { outputVersion: '2.1.2', prettyPrint: false });
        expect(result).toContain('<gml:Point');
        expect(result).toContain('<gml:coordinates>10,20</gml:coordinates>');
    });

    it('parses featureMember directly', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:name>Test</my:name>
                    <gml:Point>
                        <gml:pos>10 20</gml:pos>
                    </gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Feature',
            id: 'f1',
            properties: { 'my:name': 'Test' },
        });
    });

    it('parses LinearRing directly', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:LinearRing xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
            </gml:LinearRing>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'LineString',
            coordinates: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        });
    });

    it('parses GML 2.1.2 LinearRing with coordinates', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:LinearRing xmlns:gml="http://www.opengis.net/gml">
                <gml:coordinates>0,0 10,0 10,10 0,10 0,0</gml:coordinates>
            </gml:LinearRing>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'LineString',
            coordinates: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        });
    });


    it('parses feature with boundedBy', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <gml:boundedBy>
                        <gml:Envelope>
                            <gml:lowerCorner>0 0</gml:lowerCorner>
                            <gml:upperCorner>10 10</gml:upperCorner>
                        </gml:Envelope>
                    </gml:boundedBy>
                    <my:name>Test</my:name>
                    <gml:Point>
                        <gml:pos>5 5</gml:pos>
                    </gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Feature',
            bbox: [0, 0, 10, 10],
        });
    });

    it('parses GML 2.1.2 MultiLineString with coordinates', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiLineString xmlns:gml="http://www.opengis.net/gml">
                <gml:coordinates>0,0 10,10</gml:coordinates>
            </gml:MultiLineString>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiLineString',
            coordinates: [[[0, 0], [10, 10]]],
        });
    });

    it('throws error for invalid featureMember', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:boundedBy></gml:boundedBy>
            </gml:featureMember>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('No geometry found');
    });

    it('throws error for feature without geometry', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:name>Test</my:name>
                </my:Feature>
            </gml:featureMember>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('No geometry found for feature');
    });

    it('throws error for invalid Curve', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Curve xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:segments>
                </gml:segments>
            </gml:Curve>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Curve');
    });

    it('throws error for invalid Surface', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Surface xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:patches>
                </gml:patches>
            </gml:Surface>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Surface');
    });

    it('throws error for invalid LineString', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:LineString xmlns:gml="http://www.opengis.net/gml/3.2">
            </gml:LineString>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML LineString');
    });

    it('throws error for invalid LinearRing', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:LinearRing xmlns:gml="http://www.opengis.net/gml/3.2">
            </gml:LinearRing>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML LinearRing');
    });

    it('throws error for invalid Polygon', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2">
            </gml:Polygon>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Polygon');
    });

    it('throws error for invalid Envelope', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Envelope xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:lowerCorner>0</gml:lowerCorner>
                <gml:upperCorner>10</gml:upperCorner>
            </gml:Envelope>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Envelope');
    });

    it('throws error for invalid Box', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Box xmlns:gml="http://www.opengis.net/gml">
                <gml:coordinates>0 0</gml:coordinates>
            </gml:Box>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Box');
    });

    it('throws error for invalid MultiPoint', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiPoint xmlns:gml="http://www.opengis.net/gml">
            </gml:MultiPoint>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML MultiPoint');
    });

    it('throws error for invalid MultiLineString', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiLineString xmlns:gml="http://www.opengis.net/gml">
            </gml:MultiLineString>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML MultiLineString');
    });

    it('throws error for unsupported geometry type in builder', async () => {
        const parser = new GmlParser();
        // This should never happen in practice, but tests the default case
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pos>10 20</gml:pos>
            </gml:Point>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({ type: 'Point' });
    });

    it('parses empty array element', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2">
            </gml:FeatureCollection>
        `;

        const result = await parser.parse(gml);
        const collection = result as any;
        expect(collection.type).toBe('FeatureCollection');
        expect(collection.features).toHaveLength(0);
    });

    it('handles MultiPoint with null/undefined point members', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiPoint xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pointMember>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </gml:pointMember>
            </gml:MultiPoint>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiPoint',
            coordinates: [[10, 20]],
        });
    });

    it('handles MultiLineString with null/undefined members', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiLineString xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:lineStringMember>
                    <gml:LineString><gml:posList>0 0 10 10</gml:posList></gml:LineString>
                </gml:lineStringMember>
            </gml:MultiLineString>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiLineString',
            coordinates: [[[0, 0], [10, 10]]],
        });
    });

    it('handles MultiPolygon with null/undefined members', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:polygonMember>
                    <gml:Polygon>
                        <gml:exterior>
                            <gml:LinearRing>
                                <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
                            </gml:LinearRing>
                        </gml:exterior>
                    </gml:Polygon>
                </gml:polygonMember>
            </gml:MultiPolygon>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiPolygon',
            coordinates: [[[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]],
        });
    });

    it('handles MultiSurface with null/undefined surface members', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:surfaceMember>
                    <gml:Polygon>
                        <gml:exterior>
                            <gml:LinearRing>
                                <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
                            </gml:LinearRing>
                        </gml:exterior>
                    </gml:Polygon>
                </gml:surfaceMember>
            </gml:MultiSurface>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiPolygon',
        });
    });

    it('parses Polygon with GML 2.1.2 inner boundaries that have empty coordinates', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Polygon xmlns:gml="http://www.opengis.net/gml">
                <gml:outerBoundaryIs>
                    <gml:LinearRing>
                        <gml:coordinates>0,0 10,0 10,10 0,10 0,0</gml:coordinates>
                    </gml:LinearRing>
                </gml:outerBoundaryIs>
                <gml:innerBoundaryIs>
                    <gml:LinearRing>
                    </gml:LinearRing>
                </gml:innerBoundaryIs>
            </gml:Polygon>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Polygon',
            coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        });
    });

    it('parses Polygon with GML 3.2 interior rings that have empty coordinates', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:exterior>
                    <gml:LinearRing>
                        <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
                    </gml:LinearRing>
                </gml:exterior>
                <gml:interior>
                    <gml:LinearRing>
                    </gml:LinearRing>
                </gml:interior>
            </gml:Polygon>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Polygon',
            coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        });
    });

    it('handles feature property with array values', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:names>
                        <my:name>Name 1</my:name>
                        <my:name>Name 2</my:name>
                    </my:names>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Feature',
            id: 'f1',
        });
    });

    it('handles feature with numeric and boolean text values', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:count>42</my:count>
                    <my:active>true</my:active>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.properties['my:count']).toBe('42');
        expect(feature.properties['my:active']).toBe('true');
    });

    it('normalizes element array with empty array', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pos>10 20</gml:pos>
            </gml:Point>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('parses FeatureCollection directly via parseElement', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <gml:featureMember>
                    <my:Feature gml:id="f1">
                        <my:name>Test</my:name>
                        <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                    </my:Feature>
                </gml:featureMember>
            </gml:FeatureCollection>
        `;

        const result = await parser.parse(gml);
        const collection = result as any;
        expect(collection.type).toBe('FeatureCollection');
        expect(collection.features).toHaveLength(1);
    });


    it('throws error for invalid Curve without segments', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Curve xmlns:gml="http://www.opengis.net/gml/3.2">
            </gml:Curve>
        `;

        await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Curve');
    });

    it('handles MultiPoint with empty pointMember', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiPoint xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pointMember>
                </gml:pointMember>
            </gml:MultiPoint>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiPoint',
            coordinates: [],
        });
    });

    it('handles MultiSurface with empty surfaceMember', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:surfaceMember>
                </gml:surfaceMember>
            </gml:MultiSurface>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'MultiPolygon',
            coordinates: [],
        });
    });

    it('handles feature properties with nested objects', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:metadata>
                        <my:author>John Doe</my:author>
                        <my:date>2024-01-01</my:date>
                    </my:metadata>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.type).toBe('Feature');
        expect(feature.properties['my:metadata']).toBeDefined();
    });

    it('handles feature properties with array of arrays', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:values>
                        <my:set>
                            <my:value>1</my:value>
                            <my:value>2</my:value>
                        </my:set>
                        <my:set>
                            <my:value>3</my:value>
                            <my:value>4</my:value>
                        </my:set>
                    </my:values>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.type).toBe('Feature');
        expect(feature.properties['my:values']).toBeDefined();
    });

    it('handles getText with number and boolean primitives', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:numberValue>42</my:numberValue>
                    <my:boolValue>true</my:boolValue>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(typeof feature.properties['my:numberValue']).toBe('string');
        expect(typeof feature.properties['my:boolValue']).toBe('string');
    });

    it('handles getText with array containing mixed values', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:mixed>
                        <my:item>text1</my:item>
                        <my:item>text2</my:item>
                    </my:mixed>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.type).toBe('Feature');
    });

    it('normalizePropertyValue with trimmed string values', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:name>  Test Name  </my:name>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.properties['my:name']).toBe('Test Name');
    });

    it('handles feature properties that return primitive values', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:primitiveValue>simple</my:primitiveValue>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.properties['my:primitiveValue']).toBe('simple');
    });

    it('parses FeatureCollection using parseElement with FeatureCollection case', async () => {
        const parser = new GmlParser();
        const gml = `
            <root>
                <gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                    <gml:featureMember>
                        <my:Feature gml:id="f1">
                            <my:name>Test</my:name>
                            <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                        </my:Feature>
                    </gml:featureMember>
                </gml:FeatureCollection>
            </root>
        `;

        const result = await parser.parse(gml);
        const collection = result as any;
        expect(collection.type).toBe('FeatureCollection');
        expect(collection.features).toHaveLength(1);
    });

    it('parses interior rings in Polygon that return empty arrays', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:exterior>
                    <gml:LinearRing>
                        <gml:posList>0 0 10 0 10 10 0 10 0 0</gml:posList>
                    </gml:LinearRing>
                </gml:exterior>
                <gml:interior>
                    <gml:LinearRing>
                        <gml:pos>5 5</gml:pos>
                    </gml:LinearRing>
                </gml:interior>
            </gml:Polygon>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Polygon',
        });
    });

    it('calls geometryToGeoJson for LineString conversion', async () => {
        const parser = new GmlParser();
        const lineString = {
            type: 'LineString' as const,
            coordinates: [[0, 0], [10, 10]],
            version: '3.2' as const,
        };

        const result = await parser.convertGeometry(lineString, { outputVersion: '3.2', prettyPrint: false });
        expect(result).toContain('<gml:LineString');
    });

    it('handles findFirstGmlEntry with array of objects', async () => {
        const parser = new GmlParser();
        const gml = `
            <root xmlns:gml="http://www.opengis.net/gml/3.2">
                <wrapper>
                    <items>
                        <item>
                            <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                        </item>
                    </items>
                </wrapper>
            </root>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('normalizes property values with null and undefined', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:nullProp></my:nullProp>
                    <my:name>Test</my:name>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.type).toBe('Feature');
        expect(feature.properties['my:name']).toBe('Test');
    });

    it('handles getText with _ property containing text', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:featureMember xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:my="https://example.com/my">
                <my:Feature gml:id="f1">
                    <my:description>Some description text</my:description>
                    <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                </my:Feature>
            </gml:featureMember>
        `;

        const result = await parser.parse(gml);
        const feature = result as any;
        expect(feature.properties['my:description']).toBe('Some description text');
    });

    it('handles coordinates with comma-space separation in GML 2.1.2', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:4326">
                <gml:coordinates>10,20</gml:coordinates>
            </gml:Point>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('handles coordinates with space-only separation', async () => {
        const parser = new GmlParser();
        const gml = `
            <gml:LineString xmlns:gml="http://www.opengis.net/gml">
                <gml:coordinates>0 0 10 10</gml:coordinates>
            </gml:LineString>
        `;

        const result = await parser.parse(gml);
        expect(result).toMatchObject({
            type: 'LineString',
        });
    });
});

describe('GmlParser URL Methods', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('parseFromUrl', () => {
        it('fetches and parses GML from URL', async () => {
            const gmlXml = `
                <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                    <gml:pos>10 20</gml:pos>
                </gml:Point>
            `;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: async () => gmlXml,
            } as Response);

            const parser = new GmlParser();
            const result = await parser.parseFromUrl('https://example.com/data.gml');

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/data.gml');
            expect(result).toEqual({
                type: 'Point',
                coordinates: [10, 20],
            });
        });

        it('throws error when fetch fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            } as Response);

            const parser = new GmlParser();
            await expect(parser.parseFromUrl('https://example.com/missing.gml'))
                .rejects.toThrow('Failed to fetch GML from https://example.com/missing.gml (404 Not Found)');
        });

        it('parses WFS response from URL', async () => {
            const wfsXml = `
                <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:test="http://example.com/test">
                    <wfs:member>
                        <test:TestFeature gml:id="f1">
                            <test:name>Test</test:name>
                            <test:geometry>
                                <gml:Point>
                                    <gml:pos>5 10</gml:pos>
                                </gml:Point>
                            </test:geometry>
                        </test:TestFeature>
                    </wfs:member>
                </wfs:FeatureCollection>
            `;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: async () => wfsXml,
            } as Response);

            const parser = new GmlParser();
            const result = await parser.parseFromUrl('https://example.com/wfs?request=GetFeature') as any;

            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toHaveLength(1);
            expect(result.features[0].geometry.type).toBe('Point');
        });
    });

    describe('convertFromUrl', () => {
        it('fetches and converts GML from URL', async () => {
            const gml32 = `
                <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                    <gml:pos>10 20</gml:pos>
                </gml:Point>
            `;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: async () => gml32,
            } as Response);

            const parser = new GmlParser();
            const result = await parser.convertFromUrl('https://example.com/data.gml', {
                outputVersion: '2.1.2',
            });

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/data.gml');
            expect(result).toContain('gml:coordinates');
            expect(result).toContain('10,20');
        });

        it('throws error when fetch fails during conversion', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            } as Response);

            const parser = new GmlParser();
            await expect(parser.convertFromUrl('https://example.com/data.gml', {
                outputVersion: '2.1.2',
            })).rejects.toThrow('Failed to fetch GML from https://example.com/data.gml (500 Internal Server Error)');
        });

        it('converts with pretty print option', async () => {
            const gmlXml = `
                <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                    <gml:pos>10 20</gml:pos>
                </gml:Point>
            `;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: async () => gmlXml,
            } as Response);

            const parser = new GmlParser();
            const result = await parser.convertFromUrl('https://example.com/data.gml', {
                outputVersion: '2.1.2',
                prettyPrint: true,
            });

            // Pretty printed XML should have newlines
            expect(result.split('\n').length).toBeGreaterThan(1);
        });
    });
});

describe('GmlParser Custom Builder', () => {
    it('accepts custom builder in constructor', async () => {
        const customBuilder = {
            buildPoint: jest.fn((gml) => ({
                type: 'CustomPoint',
                x: gml.coordinates[0],
                y: gml.coordinates[1],
            })),
            buildLineString: jest.fn(),
            buildPolygon: jest.fn(),
            buildMultiPoint: jest.fn(),
            buildMultiLineString: jest.fn(),
            buildMultiPolygon: jest.fn(),
            buildLinearRing: jest.fn(),
            buildEnvelope: jest.fn(),
            buildBox: jest.fn(),
            buildCurve: jest.fn(),
            buildSurface: jest.fn(),
            buildFeature: jest.fn(),
            buildFeatureCollection: jest.fn(),
        };

        const parser = new GmlParser(customBuilder as any);
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pos>10 20</gml:pos>
            </gml:Point>
        `;

        const result = await parser.parse(gml);

        expect(customBuilder.buildPoint).toHaveBeenCalled();
        expect(result).toEqual({
            type: 'CustomPoint',
            x: 10,
            y: 20,
        });
    });

    it('uses default GeoJSON builder when no builder specified', async () => {
        const parser = new GmlParser(); // Default to 'geojson'
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pos>10 20</gml:pos>
            </gml:Point>
        `;

        const result = await parser.parse(gml);

        expect(result).toEqual({
            type: 'Point',
            coordinates: [10, 20],
        });
    });

    it('accepts format string in constructor', async () => {
        const parser = new GmlParser('geojson');
        const gml = `
            <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pos>10 20</gml:pos>
            </gml:Point>
        `;

        const result = await parser.parse(gml);

        expect(result).toEqual({
            type: 'Point',
            coordinates: [10, 20],
        });
    });
});
