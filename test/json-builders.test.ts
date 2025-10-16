import { GmlParser, CisJsonBuilder, CoverageJsonBuilder } from '../src/index.js';

describe('JSON Coverage Builders', () => {
    const coverageGml = `
        <gml:RectifiedGridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" gml:id="RGC_TEST">
            <gml:boundedBy>
                <gml:Envelope srsName="EPSG:4326">
                    <gml:lowerCorner>1.0 1.0</gml:lowerCorner>
                    <gml:upperCorner>10.0 20.0</gml:upperCorner>
                </gml:Envelope>
            </gml:boundedBy>
            <gml:domainSet>
                <gml:RectifiedGrid gml:id="RG_TEST" dimension="2" srsName="EPSG:4326">
                    <gml:limits>
                        <gml:GridEnvelope>
                            <gml:low>0 0</gml:low>
                            <gml:high>99 199</gml:high>
                        </gml:GridEnvelope>
                    </gml:limits>
                    <gml:axisLabels>x y</gml:axisLabels>
                    <gml:origin>
                        <gml:Point gml:id="P_TEST">
                            <gml:pos>10.0 1.0</gml:pos>
                        </gml:Point>
                    </gml:origin>
                    <gml:offsetVector>0.1 0</gml:offsetVector>
                    <gml:offsetVector>0 0.1</gml:offsetVector>
                </gml:RectifiedGrid>
            </gml:domainSet>
            <gml:rangeSet>
                <gml:File>
                    <gml:rangeParameters/>
                    <gml:fileName>test_coverage.tif</gml:fileName>
                    <gml:fileStructure>Record Interleaved</gml:fileStructure>
                </gml:File>
            </gml:rangeSet>
        </gml:RectifiedGridCoverage>
    `;

    describe('CIS JSON Builder', () => {
        it('should parse GML Coverage to CIS JSON format', async () => {
            const parser = new GmlParser('cis-json');
            const result = await parser.parse(coverageGml) as any;

            expect(result['@context']).toBe('http://www.opengis.net/cis/1.1/json');
            expect(result.type).toBe('CoverageByDomainAndRangeType');
            expect(result.id).toBe('RGC_TEST');
        });

        it('should include domainSet with GeneralGrid', async () => {
            const parser = new GmlParser('cis-json');
            const result = await parser.parse(coverageGml) as any;

            expect(result.domainSet).toBeDefined();
            expect(result.domainSet.type).toBe('GeneralGrid');
            expect(result.domainSet.srsName).toBe('EPSG:4326');
            expect(result.domainSet.axisLabels).toEqual(['x', 'y']);
            expect(result.domainSet.axis).toHaveLength(2);
        });

        it('should include boundedBy envelope', async () => {
            const parser = new GmlParser('cis-json');
            const result = await parser.parse(coverageGml) as any;

            expect(result.boundedBy).toBeDefined();
            expect(result.boundedBy.Envelope).toBeDefined();
            expect(result.boundedBy.Envelope.lowerCorner).toEqual([1, 1]);
            expect(result.boundedBy.Envelope.upperCorner).toEqual([10, 20]);
        });

        it('should include rangeSet with file reference', async () => {
            const parser = new GmlParser('cis-json');
            const result = await parser.parse(coverageGml) as any;

            expect(result.rangeSet).toBeDefined();
            expect(result.rangeSet.type).toBe('DataBlock');
            expect(result.rangeSet.dataReference.type).toBe('FileReference');
            expect(result.rangeSet.dataReference.fileURL).toBe('test_coverage.tif');
            expect(result.rangeSet.dataReference.fileStructure).toBe('Record Interleaved');
        });

        it('should use json-coverage alias', async () => {
            const parser = new GmlParser('json-coverage');
            const result = await parser.parse(coverageGml) as any;

            expect(result.type).toBe('CoverageByDomainAndRangeType');
        });
    });

    describe('CoverageJSON Builder', () => {
        it('should parse GML Coverage to CoverageJSON format', async () => {
            const parser = new GmlParser('coveragejson');
            const result = await parser.parse(coverageGml) as any;

            expect(result.type).toBe('Coverage');
            expect(result.domain).toBeDefined();
            expect(result.parameters).toBeDefined();
            expect(result.ranges).toBeDefined();
        });

        it('should create Grid domain with axes', async () => {
            const parser = new GmlParser('coveragejson');
            const result = await parser.parse(coverageGml) as any;

            expect(result.domain.type).toBe('Domain');
            expect(result.domain.domainType).toBe('Grid');
            expect(result.domain.axes).toBeDefined();
            expect(result.domain.axes.x).toBeDefined();
            expect(result.domain.axes.y).toBeDefined();
        });

        it('should include axes with start, stop, num', async () => {
            const parser = new GmlParser('coveragejson');
            const result = await parser.parse(coverageGml) as any;

            expect(result.domain.axes.x.start).toBe(10.0);
            expect(result.domain.axes.x.num).toBe(100);
            expect(result.domain.axes.y.start).toBe(1.0);
            expect(result.domain.axes.y.num).toBe(200);
        });

        it('should include referencing with CRS', async () => {
            const parser = new GmlParser('coveragejson');
            const result = await parser.parse(coverageGml) as any;

            expect(result.domain.referencing).toBeDefined();
            expect(result.domain.referencing[0].coordinates).toEqual(['x', 'y']);
            expect(result.domain.referencing[0].system.id).toBe('EPSG:4326');
        });

        it('should create parameters', async () => {
            const parser = new GmlParser('coveragejson');
            const result = await parser.parse(coverageGml) as any;

            expect(result.parameters).toBeDefined();
            expect(Object.keys(result.parameters).length).toBeGreaterThan(0);
        });

        it('should create ranges with TiledNdArray', async () => {
            const parser = new GmlParser('coveragejson');
            const result = await parser.parse(coverageGml) as any;

            expect(result.ranges).toBeDefined();
            const firstRange = Object.values(result.ranges)[0] as any;
            expect(firstRange.type).toBe('TiledNdArray');
            expect(firstRange.axisNames).toEqual(['x', 'y']);
        });

        it('should use covjson alias', async () => {
            const parser = new GmlParser('covjson');
            const result = await parser.parse(coverageGml) as any;

            expect(result.type).toBe('Coverage');
        });
    });

    describe('Builder Comparison', () => {
        it('should produce different output formats', async () => {
            const cisParser = new GmlParser('cis-json');
            const covjsonParser = new GmlParser('coveragejson');
            const geojsonParser = new GmlParser('geojson');

            const cisResult = await cisParser.parse(coverageGml) as any;
            const covjsonResult = await covjsonParser.parse(coverageGml) as any;
            const geojsonResult = await geojsonParser.parse(coverageGml) as any;

            // CIS JSON should have @context
            expect(cisResult['@context']).toBeDefined();
            expect(covjsonResult['@context']).toBeUndefined();

            // CoverageJSON should have domain/parameters/ranges
            expect(covjsonResult.domain).toBeDefined();
            expect(covjsonResult.parameters).toBeDefined();
            expect(covjsonResult.ranges).toBeDefined();

            // GeoJSON should be a Feature
            expect(geojsonResult.type).toBe('Feature');
            expect((geojsonResult as any).properties).toBeDefined();
        });
    });

    describe('Direct Builder Usage', () => {
        it('should allow direct CisJsonBuilder instantiation', () => {
            const builder = new CisJsonBuilder();
            const parser = new GmlParser(builder);
            expect(parser).toBeDefined();
        });

        it('should allow direct CoverageJsonBuilder instantiation', () => {
            const builder = new CoverageJsonBuilder();
            const parser = new GmlParser(builder);
            expect(parser).toBeDefined();
        });
    });
});
