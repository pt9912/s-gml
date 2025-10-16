import { GmlParser, CoverageGenerator, generateCoverageXml } from '../src/index.js';
import type {
    GmlRectifiedGridCoverage,
    GmlGridCoverage,
    GmlReferenceableGridCoverage,
    GmlMultiPointCoverage,
} from '../src/types.js';

describe('Coverage Generator', () => {
    const generator = new CoverageGenerator();

    describe('RectifiedGridCoverage', () => {
        it('should generate RectifiedGridCoverage XML', () => {
            const coverage: GmlRectifiedGridCoverage = {
                type: 'RectifiedGridCoverage',
                id: 'RGC01',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [1, 1, 10, 20],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    id: 'RG01',
                    dimension: 2,
                    srsName: 'EPSG:4326',
                    limits: { low: [0, 0], high: [99, 199] },
                    axisLabels: ['Lat', 'Long'],
                    origin: [10.0, 1.0],
                    offsetVectors: [[0, 0.1], [-0.1, 0]],
                },
                rangeSet: {
                    file: {
                        fileName: 'coverage_data.tif',
                        fileStructure: 'Record Interleaved',
                    },
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gml:RectifiedGridCoverage');
            expect(xml).toContain('gml:id="RGC01"');
            expect(xml).toContain('xmlns:gml="http://www.opengis.net/gml/3.2"');
            expect(xml).toContain('xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0"');
            expect(xml).toContain('<gml:boundedBy>');
            expect(xml).toContain('<gml:lowerCorner>1 1</gml:lowerCorner>');
            expect(xml).toContain('<gml:upperCorner>10 20</gml:upperCorner>');
            expect(xml).toContain('<gml:RectifiedGrid');
            expect(xml).toContain('dimension="2"');
            expect(xml).toContain('srsName="EPSG:4326"');
            expect(xml).toContain('<gml:low>0 0</gml:low>');
            expect(xml).toContain('<gml:high>99 199</gml:high>');
            expect(xml).toContain('<gml:axisLabels>Lat Long</gml:axisLabels>');
            expect(xml).toContain('<gml:pos>10 1</gml:pos>');
            expect(xml).toContain('<gml:offsetVector>0 0.1</gml:offsetVector>');
            expect(xml).toContain('<gml:offsetVector>-0.1 0</gml:offsetVector>');
            expect(xml).toContain('<gml:fileName>coverage_data.tif</gml:fileName>');
            expect(xml).toContain('<gml:fileStructure>Record Interleaved</gml:fileStructure>');
        });

        it('should generate RectifiedGridCoverage with multi-band RangeType', () => {
            const coverage: GmlRectifiedGridCoverage = {
                type: 'RectifiedGridCoverage',
                id: 'RGB_COVERAGE',
                domainSet: {
                    dimension: 2,
                    limits: { low: [0, 0], high: [100, 100] },
                    origin: [0, 0],
                    offsetVectors: [[1, 0], [0, 1]],
                },
                rangeSet: {
                    file: { fileName: 'rgb.tif' },
                },
                rangeType: {
                    field: [
                        { name: 'red', dataType: 'uint8', uom: 'W.m-2.sr-1', description: 'Red band' },
                        { name: 'green', dataType: 'uint8', uom: 'W.m-2.sr-1', description: 'Green band' },
                        { name: 'blue', dataType: 'uint8', uom: 'W.m-2.sr-1', description: 'Blue band' },
                    ],
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gmlcov:rangeType>');
            expect(xml).toContain('<swe:DataRecord>');
            expect(xml).toContain('<swe:field name="red">');
            expect(xml).toContain('<swe:field name="green">');
            expect(xml).toContain('<swe:field name="blue">');
            expect(xml).toContain('uom="W.m-2.sr-1"');
            expect(xml).toContain('<swe:description>Red band</swe:description>');
            expect(xml).toContain('<swe:dataType>uint8</swe:dataType>');
        });

        it('should generate pretty-printed XML when requested', () => {
            const coverage: GmlRectifiedGridCoverage = {
                type: 'RectifiedGridCoverage',
                id: 'TEST',
                domainSet: {
                    dimension: 2,
                    limits: { low: [0, 0], high: [10, 10] },
                    origin: [0, 0],
                    offsetVectors: [[1, 0], [0, 1]],
                },
                rangeSet: { file: { fileName: 'test.tif' } },
                version: '3.2',
            };

            const xml = generator.generate(coverage, true);

            // Check for indentation (multiple spaces at line start)
            const lines = xml.split('\n');
            const indentedLines = lines.filter(line => line.match(/^ {4}/));
            expect(indentedLines.length).toBeGreaterThan(5);
        });
    });

    describe('GridCoverage', () => {
        it('should generate GridCoverage XML', () => {
            const coverage: GmlGridCoverage = {
                type: 'GridCoverage',
                id: 'GC01',
                domainSet: {
                    id: 'G01',
                    dimension: 2,
                    limits: { low: [0, 0], high: [50, 50] },
                    axisLabels: ['x', 'y'],
                },
                rangeSet: {
                    file: { fileName: 'grid_data.nc' },
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gml:GridCoverage');
            expect(xml).toContain('gml:id="GC01"');
            expect(xml).toContain('<gml:Grid');
            expect(xml).toContain('dimension="2"');
            expect(xml).toContain('<gml:low>0 0</gml:low>');
            expect(xml).toContain('<gml:high>50 50</gml:high>');
            expect(xml).toContain('<gml:axisLabels>x y</gml:axisLabels>');
            expect(xml).toContain('<gml:fileName>grid_data.nc</gml:fileName>');
        });
    });

    describe('ReferenceableGridCoverage', () => {
        it('should generate ReferenceableGridCoverage XML', () => {
            const coverage: GmlReferenceableGridCoverage = {
                type: 'ReferenceableGridCoverage',
                id: 'REFGC01',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [-180, -90, 180, 90],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    id: 'REFG01',
                    dimension: 2,
                    limits: { low: [0, 0], high: [719, 359] },
                    axisLabels: ['lon', 'lat'],
                },
                rangeSet: {
                    file: {
                        fileName: 'irregular_grid.nc',
                        fileStructure: 'netCDF',
                    },
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gml:ReferenceableGridCoverage');
            expect(xml).toContain('gml:id="REFGC01"');
            expect(xml).toContain('xmlns:gml="http://www.opengis.net/gml/3.2"');
            expect(xml).toContain('xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0"');
            expect(xml).toContain('<gml:boundedBy>');
            expect(xml).toContain('<gml:lowerCorner>-180 -90</gml:lowerCorner>');
            expect(xml).toContain('<gml:upperCorner>180 90</gml:upperCorner>');
            expect(xml).toContain('<gml:Grid');
            expect(xml).toContain('gml:id="REFG01"');
            expect(xml).toContain('dimension="2"');
            expect(xml).toContain('<gml:low>0 0</gml:low>');
            expect(xml).toContain('<gml:high>719 359</gml:high>');
            expect(xml).toContain('<gml:axisLabels>lon lat</gml:axisLabels>');
            expect(xml).toContain('<gml:fileName>irregular_grid.nc</gml:fileName>');
            expect(xml).toContain('<gml:fileStructure>netCDF</gml:fileStructure>');
            expect(xml).toContain('</gml:ReferenceableGridCoverage>');
        });

        it('should generate ReferenceableGridCoverage with multi-band RangeType', () => {
            const coverage: GmlReferenceableGridCoverage = {
                type: 'ReferenceableGridCoverage',
                id: 'MODIS_LST',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [-120, 30, -110, 40],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    dimension: 2,
                    limits: { low: [0, 0], high: [1199, 1199] },
                    axisLabels: ['x', 'y'],
                },
                rangeSet: {
                    file: { fileName: 'modis_lst.hdf' },
                },
                rangeType: {
                    field: [
                        { name: 'LST_Day', dataType: 'uint16', uom: 'K', description: 'Daytime Land Surface Temperature' },
                        { name: 'LST_Night', dataType: 'uint16', uom: 'K', description: 'Nighttime Land Surface Temperature' },
                        { name: 'QC_Day', dataType: 'uint8', description: 'Quality Control for Day' },
                        { name: 'QC_Night', dataType: 'uint8', description: 'Quality Control for Night' },
                    ],
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gml:ReferenceableGridCoverage');
            expect(xml).toContain('gml:id="MODIS_LST"');
            expect(xml).toContain('<gmlcov:rangeType>');
            expect(xml).toContain('<swe:DataRecord>');
            expect(xml).toContain('<swe:field name="LST_Day">');
            expect(xml).toContain('<swe:field name="LST_Night">');
            expect(xml).toContain('<swe:field name="QC_Day">');
            expect(xml).toContain('<swe:field name="QC_Night">');
            expect(xml).toContain('uom="K"');
            expect(xml).toContain('<swe:description>Daytime Land Surface Temperature</swe:description>');
            expect(xml).toContain('<swe:dataType>uint16</swe:dataType>');
        });

        it('should generate ReferenceableGridCoverage without boundedBy', () => {
            const coverage: GmlReferenceableGridCoverage = {
                type: 'ReferenceableGridCoverage',
                id: 'SIMPLE_REF',
                domainSet: {
                    dimension: 2,
                    limits: { low: [0, 0], high: [99, 99] },
                },
                rangeSet: {
                    file: { fileName: 'simple.tif' },
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gml:ReferenceableGridCoverage');
            expect(xml).not.toContain('<gml:boundedBy>');
            expect(xml).toContain('<gml:Grid');
            expect(xml).toContain('dimension="2"');
        });
    });

    describe('MultiPointCoverage', () => {
        it('should generate MultiPointCoverage XML', () => {
            const coverage: GmlMultiPointCoverage = {
                type: 'MultiPointCoverage',
                id: 'MPC01',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [0, 0, 10, 10],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    type: 'MultiPoint',
                    coordinates: [[1, 2], [3, 4], [5, 6]],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                rangeSet: {
                    file: { fileName: 'sensor_data.csv', fileStructure: 'CSV' },
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gml:MultiPointCoverage');
            expect(xml).toContain('gml:id="MPC01"');
            expect(xml).toContain('<gml:MultiPoint');
            expect(xml).toContain('<gml:pointMember>');
            expect(xml).toContain('<gml:Point');
            expect(xml).toContain('<gml:pos>1 2</gml:pos>');
            expect(xml).toContain('<gml:pos>3 4</gml:pos>');
            expect(xml).toContain('<gml:pos>5 6</gml:pos>');
            expect(xml).toContain('<gml:fileName>sensor_data.csv</gml:fileName>');
        });

        it('should generate MultiPointCoverage with RangeType', () => {
            const coverage: GmlMultiPointCoverage = {
                type: 'MultiPointCoverage',
                id: 'SENSOR',
                domainSet: {
                    type: 'MultiPoint',
                    coordinates: [[1, 2]],
                    version: '3.2',
                },
                rangeSet: { file: { fileName: 'data.json' } },
                rangeType: {
                    field: [
                        { name: 'temperature', uom: 'Cel', description: 'Air temperature' },
                        { name: 'humidity', uom: '%', description: 'Relative humidity' },
                    ],
                },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('<gmlcov:rangeType>');
            expect(xml).toContain('<swe:field name="temperature">');
            expect(xml).toContain('<swe:field name="humidity">');
            expect(xml).toContain('uom="Cel"');
            expect(xml).toContain('<swe:description>Air temperature</swe:description>');
        });
    });

    describe('Round-Trip Conversion', () => {
        it('should perform round-trip conversion for RectifiedGridCoverage', async () => {
            // Create a coverage object
            const coverage: GmlRectifiedGridCoverage = {
                type: 'RectifiedGridCoverage',
                id: 'ROUNDTRIP',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [5, 10, 15, 20],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    id: 'RG_RT',
                    dimension: 2,
                    srsName: 'EPSG:4326',
                    limits: { low: [0, 0], high: [49, 99] },
                    axisLabels: ['Lat', 'Long'],
                    origin: [15.0, 5.0],
                    offsetVectors: [[0, 0.2], [-0.2, 0]],
                },
                rangeSet: {
                    file: {
                        fileName: 'roundtrip.tif',
                        fileStructure: 'GeoTIFF',
                    },
                },
                version: '3.2',
            };

            // Generate XML from object
            const generatedXml = generator.generate(coverage);

            // Parse generated XML again
            const parser = new GmlParser();
            const reparsed = await parser.parse(generatedXml) as any;

            // Verify key properties match
            expect(reparsed.properties.coverageType).toBe('RectifiedGridCoverage');
            expect(reparsed.properties.grid.dimension).toBe(2);
            expect(reparsed.properties.grid.limits.low).toEqual([0, 0]);
            expect(reparsed.properties.grid.limits.high).toEqual([49, 99]);
            expect(reparsed.properties.grid.origin).toEqual([15.0, 5.0]);
            expect(reparsed.bbox).toEqual([5, 10, 15, 20]);
        });

        it('should perform round-trip conversion for MultiPointCoverage', async () => {
            const coverage: GmlMultiPointCoverage = {
                type: 'MultiPointCoverage',
                id: 'MPC_RT',
                domainSet: {
                    type: 'MultiPoint',
                    coordinates: [[10, 20], [30, 40]],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                rangeSet: { file: { fileName: 'sensors.csv' } },
                version: '3.2',
            };

            // Generate XML
            const xml = generator.generate(coverage);

            // Parse back
            const parser = new GmlParser();
            const parsed = await parser.parse(xml) as any;

            // Verify
            expect(parsed.type).toBe('Feature');
            expect(parsed.properties.coverageType).toBe('MultiPointCoverage');
            expect(parsed.geometry.type).toBe('MultiPoint');
            expect(parsed.geometry.coordinates).toHaveLength(2);
            expect(parsed.geometry.coordinates[0]).toEqual([10, 20]);
            expect(parsed.geometry.coordinates[1]).toEqual([30, 40]);
        });

        it('should perform round-trip conversion for ReferenceableGridCoverage', async () => {
            const coverage: GmlReferenceableGridCoverage = {
                type: 'ReferenceableGridCoverage',
                id: 'REF_ROUNDTRIP',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [-180, -90, 180, 90],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    dimension: 2,
                    limits: { low: [0, 0], high: [719, 359] },
                    axisLabels: ['lon', 'lat'],
                },
                rangeSet: {
                    file: { fileName: 'ref_data.nc' },
                },
                version: '3.2',
            };

            // Generate XML
            const xml = generator.generate(coverage);

            // Parse back
            const parser = new GmlParser();
            const parsed = await parser.parse(xml) as any;

            // Verify
            expect(parsed.type).toBe('Feature');
            expect(parsed.properties.coverageType).toBe('ReferenceableGridCoverage');
            expect(parsed.properties.grid.dimension).toBe(2);
            expect(parsed.properties.grid.limits.low).toEqual([0, 0]);
            expect(parsed.properties.grid.limits.high).toEqual([719, 359]);
            expect(parsed.bbox).toEqual([-180, -90, 180, 90]);
        });
    });

    describe('Helper Function', () => {
        it('should generate coverage XML using helper function', () => {
            const coverage: GmlGridCoverage = {
                type: 'GridCoverage',
                id: 'HELPER_TEST',
                domainSet: {
                    dimension: 2,
                    limits: { low: [0, 0], high: [10, 10] },
                },
                rangeSet: { file: { fileName: 'test.nc' } },
                version: '3.2',
            };

            const xml = generateCoverageXml(coverage);

            expect(xml).toContain('<gml:GridCoverage');
            expect(xml).toContain('gml:id="HELPER_TEST"');
        });
    });

    describe('XML Escaping', () => {
        it('should properly escape XML special characters', () => {
            const coverage: GmlGridCoverage = {
                type: 'GridCoverage',
                id: 'test<>&"\'',
                domainSet: {
                    dimension: 2,
                    limits: { low: [0, 0], high: [1, 1] },
                },
                rangeSet: { file: { fileName: 'file<>&"\'.nc' } },
                version: '3.2',
            };

            const xml = generator.generate(coverage);

            expect(xml).toContain('gml:id="test&lt;&gt;&amp;&quot;&apos;"');
            expect(xml).toContain('<gml:fileName>file&lt;&gt;&amp;&quot;&apos;.nc</gml:fileName>');
            expect(xml).not.toContain('test<>&"\'');
        });
    });
});
