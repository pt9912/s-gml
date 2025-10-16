import { GmlParser, getBuilder, GeoJsonBuilder, CisJsonBuilder, CoverageJsonBuilder, ShapefileBuilder } from '../src/index.js';
import type { FeatureCollection } from '../src/types.js';

describe('Builder Integration Tests', () => {
    // Ein einfaches GML FeatureCollection mit zwei Point-Features
    const featureCollectionGml = `
        <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2">
            <wfs:member>
                <Feature gml:id="F1">
                    <geometry>
                        <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                    </geometry>
                    <name>Test Point 1</name>
                    <value>100</value>
                </Feature>
            </wfs:member>
            <wfs:member>
                <Feature gml:id="F2">
                    <geometry>
                        <gml:Point><gml:pos>15 25</gml:pos></gml:Point>
                    </geometry>
                    <name>Test Point 2</name>
                    <value>200</value>
                </Feature>
            </wfs:member>
        </wfs:FeatureCollection>
    `;

    // Ein Coverage für Coverage-Builder Tests
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

    describe('GeoJSON Builder Integration', () => {
        it('should parse GML to GeoJSON using getBuilder("geojson")', async () => {
            const builder = getBuilder('geojson');
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml);

            expect(result).toHaveProperty('type', 'FeatureCollection');
            expect((result as FeatureCollection).features).toHaveLength(2);
            expect((result as FeatureCollection).features[0].id).toBe('F1');
            expect((result as FeatureCollection).features[0].properties?.name).toBe('Test Point 1');
            expect((result as FeatureCollection).features[0].properties?.value).toBe('100');
            expect((result as FeatureCollection).features[0].geometry.type).toBe('Point');
        });

        it('should work with direct GeoJsonBuilder instance', async () => {
            const builder = new GeoJsonBuilder();
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml);

            expect(result).toHaveProperty('type', 'FeatureCollection');
            expect((result as FeatureCollection).features).toHaveLength(2);
        });
    });

    describe('CSV Builder Integration', () => {
        it('should parse GML to CSV using getBuilder("csv")', async () => {
            const builder = getBuilder('csv');
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml);

            expect(typeof result).toBe('string');
            expect(result).toContain('id,geometry,name,value');
            expect(result).toContain('F1,POINT (10 20),Test Point 1,100');
            expect(result).toContain('F2,POINT (15 25),Test Point 2,200');
        });

    });

    describe('KML Builder Integration', () => {
        it('should parse GML to KML using getBuilder("kml")', async () => {
            const builder = getBuilder('kml');
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml);

            expect(typeof result).toBe('string');
            expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(result).toContain('<kml xmlns="http://www.opengis.net/kml/2.2">');
            expect(result).toContain('<Document>');
            expect(result).toContain('<Placemark>');
            expect(result).toContain('<name>Test Point 1</name>');
            expect(result).toContain('<Point><coordinates>10,20</coordinates></Point>');
        });

    });

    describe('WKT Builder Integration', () => {
        it('should parse GML to WKT Collection using getBuilder("wkt")', async () => {
            const builder = getBuilder('wkt');
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml) as any;

            expect(result).toHaveProperty('features');
            expect(result.features).toHaveLength(2);
            expect(result.features[0].id).toBe('F1');
            expect(result.features[0].wkt).toBe('POINT (10 20)');
            expect(result.features[0].properties.name).toBe('Test Point 1');
            expect(result.features[1].id).toBe('F2');
            expect(result.features[1].wkt).toBe('POINT (15 25)');
        });

    });

    describe('CIS JSON Builder Integration', () => {
        it('should parse GML Coverage to CIS JSON using getBuilder("cis-json")', async () => {
            const builder = getBuilder('cis-json');
            const parser = new GmlParser(builder);
            const result = await parser.parse(coverageGml) as any;

            expect(result['@context']).toBe('http://www.opengis.net/cis/1.1/json');
            expect(result.type).toBe('CoverageByDomainAndRangeType');
            expect(result.id).toBe('RGC_TEST');
            expect(result.domainSet).toBeDefined();
            expect(result.rangeSet).toBeDefined();
        });

        it('should work with "json-coverage" alias', async () => {
            const builder = getBuilder('json-coverage');
            const parser = new GmlParser(builder);
            const result = await parser.parse(coverageGml) as any;

            expect(result.type).toBe('CoverageByDomainAndRangeType');
        });

        it('should work with direct CisJsonBuilder instance', async () => {
            const builder = new CisJsonBuilder();
            const parser = new GmlParser(builder);
            const result = await parser.parse(coverageGml) as any;

            expect(result['@context']).toBe('http://www.opengis.net/cis/1.1/json');
        });
    });

    describe('CoverageJSON Builder Integration', () => {
        it('should parse GML Coverage to CoverageJSON using getBuilder("coveragejson")', async () => {
            const builder = getBuilder('coveragejson');
            const parser = new GmlParser(builder);
            const result = await parser.parse(coverageGml) as any;

            expect(result.type).toBe('Coverage');
            expect(result.domain).toBeDefined();
            expect(result.domain.type).toBe('Domain');
            expect(result.domain.domainType).toBe('Grid');
            expect(result.parameters).toBeDefined();
            expect(result.ranges).toBeDefined();
        });

        it('should work with "covjson" alias', async () => {
            const builder = getBuilder('covjson');
            const parser = new GmlParser(builder);
            const result = await parser.parse(coverageGml) as any;

            expect(result.type).toBe('Coverage');
        });

        it('should work with direct CoverageJsonBuilder instance', async () => {
            const builder = new CoverageJsonBuilder();
            const parser = new GmlParser(builder);
            const result = await parser.parse(coverageGml) as any;

            expect(result.type).toBe('Coverage');
        });
    });

    describe('Shapefile Builder Integration', () => {
        it('should parse GML to GeoJSON using getBuilder("shapefile")', async () => {
            const builder = getBuilder('shapefile');
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml);

            // ShapefileBuilder delegates to GeoJsonBuilder
            expect(result).toHaveProperty('type', 'FeatureCollection');
            expect((result as FeatureCollection).features).toHaveLength(2);
            expect((result as FeatureCollection).features[0].id).toBe('F1');
        });

        it('should work with "shp" alias', async () => {
            const builder = getBuilder('shp');
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml);

            expect(result).toHaveProperty('type', 'FeatureCollection');
        });

        it('should work with direct ShapefileBuilder instance', async () => {
            const builder = new ShapefileBuilder();
            const parser = new GmlParser(builder);
            const result = await parser.parse(featureCollectionGml);

            expect(result).toHaveProperty('type', 'FeatureCollection');
        });

        it('should be able to convert to Shapefile ZIP', async () => {
            const builder = new ShapefileBuilder();
            const parser = new GmlParser(builder);
            const geojson = await parser.parse(featureCollectionGml) as FeatureCollection;

            // toZip() konvertiert GeoJSON zu Shapefile ZIP
            const zip = await builder.toZip(geojson, {
                outputType: 'arraybuffer',
                filename: 'test',
            });

            expect(zip).toBeInstanceOf(ArrayBuffer);
            expect(zip.byteLength).toBeGreaterThan(0);
        });
    });

    describe('getBuilder() Edge Cases', () => {
        it('should throw error for unsupported format', () => {
            expect(() => getBuilder('invalid-format' as any)).toThrow();
        });

        it('should return the same builder type for aliases', () => {
            const shp1 = getBuilder('shapefile');
            const shp2 = getBuilder('shp');
            expect(shp1.constructor).toBe(shp2.constructor);

            const cis1 = getBuilder('cis-json');
            const cis2 = getBuilder('json-coverage');
            expect(cis1.constructor).toBe(cis2.constructor);

            const cov1 = getBuilder('coveragejson');
            const cov2 = getBuilder('covjson');
            expect(cov1.constructor).toBe(cov2.constructor);
        });
    });

    describe('Mixed Content Tests', () => {
        it('should handle FeatureCollection with different geometry types', async () => {
            const mixedGml = `
                <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2">
                    <wfs:member>
                        <Feature gml:id="F1">
                            <geometry>
                                <gml:Point><gml:pos>10 20</gml:pos></gml:Point>
                            </geometry>
                            <name>Point Feature</name>
                        </Feature>
                    </wfs:member>
                    <wfs:member>
                        <Feature gml:id="F2">
                            <geometry>
                                <gml:LineString>
                                    <gml:posList>0 0 10 10 20 20</gml:posList>
                                </gml:LineString>
                            </geometry>
                            <name>Line Feature</name>
                        </Feature>
                    </wfs:member>
                </wfs:FeatureCollection>
            `;

            // Test mit GeoJSON
            const geojsonBuilder = getBuilder('geojson');
            const geojsonParser = new GmlParser(geojsonBuilder);
            const geojsonResult = await geojsonParser.parse(mixedGml) as FeatureCollection;

            expect(geojsonResult.features).toHaveLength(2);
            expect(geojsonResult.features[0].geometry.type).toBe('Point');
            expect(geojsonResult.features[1].geometry.type).toBe('LineString');

            // Test mit CSV
            const csvBuilder = getBuilder('csv');
            const csvParser = new GmlParser(csvBuilder);
            const csvResult = await csvParser.parse(mixedGml) as unknown as string;

            expect(csvResult).toContain('POINT (10 20)');
            expect(csvResult).toContain('LINESTRING (0 0, 10 10, 20 20)');

            // Test mit WKT
            const wktBuilder = getBuilder('wkt');
            const wktParser = new GmlParser(wktBuilder);
            const wktResult = await wktParser.parse(mixedGml) as any;

            expect(wktResult.features[0].wkt).toBe('POINT (10 20)');
            expect(wktResult.features[1].wkt).toBe('LINESTRING (0 0, 10 10, 20 20)');
        });
    });
});
