import { StreamingGmlParser, parseGmlStream } from '../src/streaming-parser.js';
import { Readable } from 'stream';
import type { Feature } from '../src/types.js';

describe('StreamingGmlParser', () => {
    describe('Basic Streaming', () => {
        it('should parse features from a stream', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
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
    <wfs:member>
        <TestFeature gml:id="F2">
            <geometry>
                <gml:Point><gml:pos>15 25</gml:pos></gml:Point>
            </geometry>
            <name>Feature 2</name>
        </TestFeature>
    </wfs:member>
</wfs:FeatureCollection>`;

            const features: Feature[] = [];
            const parser = new StreamingGmlParser();

            parser.on('feature', (feature) => {
                features.push(feature);
            });

            const stream = Readable.from([gml]);
            await parser.parseStream(stream);

            expect(features.length).toBe(2);
            expect(features[0].id).toBe('F1');
            expect(features[0].properties?.name).toBe('Feature 1');
            expect(features[1].id).toBe('F2');
            expect(features[1].properties?.name).toBe('Feature 2');
        });

        it('should handle chunked data', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
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
</wfs:FeatureCollection>`;

            // Split into multiple chunks
            const chunks = [
                gml.substring(0, 100),
                gml.substring(100, 200),
                gml.substring(200),
            ];

            const features: Feature[] = [];
            const parser = new StreamingGmlParser();

            parser.on('feature', (feature) => {
                features.push(feature);
            });

            const stream = Readable.from(chunks);
            await parser.parseStream(stream);

            expect(features.length).toBe(1);
            expect(features[0].id).toBe('F1');
        });

        it('should support gml:featureMember', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2">
    <gml:featureMember>
        <TestFeature gml:id="F1">
            <geometry>
                <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
            </geometry>
            <name>Feature 1</name>
        </TestFeature>
    </gml:featureMember>
</gml:FeatureCollection>`;

            const features: Feature[] = [];
            const parser = new StreamingGmlParser();

            parser.on('feature', (feature) => {
                features.push(feature);
            });

            const stream = Readable.from([gml]);
            await parser.parseStream(stream);

            expect(features.length).toBe(1);
            expect(features[0].id).toBe('F1');
        });
    });

    describe('Batch Processing', () => {
        it('should process features in batches', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"
                        xmlns:gml="http://www.opengis.net/gml/3.2">
    ${Array.from({ length: 150 }, (_, i) => `
    <wfs:member>
        <TestFeature gml:id="F${i + 1}">
            <geometry>
                <gml:Point><gml:pos>${i} ${i}</gml:pos></gml:Point>
            </geometry>
            <name>Feature ${i + 1}</name>
        </TestFeature>
    </wfs:member>`).join('\n')}
</wfs:FeatureCollection>`;

            const features: Feature[] = [];
            const parser = new StreamingGmlParser({ batchSize: 50 });

            parser.on('feature', (feature) => {
                features.push(feature);
            });

            const stream = Readable.from([gml]);
            await parser.parseStream(stream);

            expect(features.length).toBe(150);
            expect(parser.getFeatureCount()).toBe(150);
        });
    });

    describe('Error Handling', () => {
        it('should emit errors for invalid GML', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"
                        xmlns:gml="http://www.opengis.net/gml/3.2">
    <wfs:member>
        <TestFeature gml:id="F1">
            <geometry>
                <gml:InvalidGeometry></gml:InvalidGeometry>
            </geometry>
        </TestFeature>
    </wfs:member>
</wfs:FeatureCollection>`;

            const errors: Error[] = [];
            const parser = new StreamingGmlParser();

            parser.on('error', (error) => {
                errors.push(error);
            });

            const stream = Readable.from([gml]);
            await parser.parseStream(stream);

            expect(errors.length).toBeGreaterThan(0);
        });

        it('should continue parsing after errors', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"
                        xmlns:gml="http://www.opengis.net/gml/3.2">
    <wfs:member>
        <TestFeature gml:id="F1">
            <geometry>
                <gml:InvalidGeometry></gml:InvalidGeometry>
            </geometry>
        </TestFeature>
    </wfs:member>
    <wfs:member>
        <TestFeature gml:id="F2">
            <geometry>
                <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
            </geometry>
            <name>Feature 2</name>
        </TestFeature>
    </wfs:member>
</wfs:FeatureCollection>`;

            const features: Feature[] = [];
            const errors: Error[] = [];
            const parser = new StreamingGmlParser();

            parser.on('feature', (feature) => {
                features.push(feature);
            });

            parser.on('error', (error) => {
                errors.push(error);
            });

            const stream = Readable.from([gml]);
            await parser.parseStream(stream);

            expect(errors.length).toBeGreaterThan(0);
            expect(features.length).toBe(1);
            expect(features[0].id).toBe('F2');
        });
    });

    describe('parseGmlStream helper', () => {
        it('should parse features with helper function', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
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
</wfs:FeatureCollection>`;

            const features: Feature[] = [];
            const stream = Readable.from([gml]);

            const count = await parseGmlStream(stream, (feature) => {
                features.push(feature);
            });

            expect(count).toBe(1);
            expect(features.length).toBe(1);
            expect(features[0].id).toBe('F1');
        });
    });

    describe('End Event', () => {
        it('should emit end event when parsing is complete', async () => {
            const gml = `<?xml version="1.0" encoding="UTF-8"?>
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
</wfs:FeatureCollection>`;

            let endEmitted = false;
            const parser = new StreamingGmlParser();

            parser.on('end', () => {
                endEmitted = true;
            });

            const stream = Readable.from([gml]);
            await parser.parseStream(stream);

            expect(endEmitted).toBe(true);
        });
    });
});
