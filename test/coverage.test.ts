import { GmlParser, extractGeoTiffMetadata, pixelToWorld, worldToPixel } from '../src/index.js';

describe('GML Coverage Support', () => {
    describe('RectifiedGridCoverage', () => {
        it('should parse RectifiedGridCoverage to GeoJSON Feature', async () => {
            const gml = `
                <gml:RectifiedGridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" gml:id="RGC01">
                    <gml:boundedBy>
                        <gml:Envelope srsName="EPSG:4326">
                            <gml:lowerCorner>1.0 1.0</gml:lowerCorner>
                            <gml:upperCorner>10.0 20.0</gml:upperCorner>
                        </gml:Envelope>
                    </gml:boundedBy>
                    <gml:domainSet>
                        <gml:RectifiedGrid gml:id="RG01" dimension="2" srsName="EPSG:4326">
                            <gml:limits>
                                <gml:GridEnvelope>
                                    <gml:low>0 0</gml:low>
                                    <gml:high>99 199</gml:high>
                                </gml:GridEnvelope>
                            </gml:limits>
                            <gml:axisLabels>Lat Long</gml:axisLabels>
                            <gml:origin>
                                <gml:Point gml:id="P01">
                                    <gml:pos>10.0 1.0</gml:pos>
                                </gml:Point>
                            </gml:origin>
                            <gml:offsetVector>0 0.1</gml:offsetVector>
                            <gml:offsetVector>-0.1 0</gml:offsetVector>
                        </gml:RectifiedGrid>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>coverage_data.tif</gml:fileName>
                            <gml:fileStructure>Record Interleaved</gml:fileStructure>
                        </gml:File>
                    </gml:rangeSet>
                </gml:RectifiedGridCoverage>
            `;

            const parser = new GmlParser();
            const result = await parser.parse(gml);

            expect(result.type).toBe('Feature');
            expect((result as any).properties.coverageType).toBe('RectifiedGridCoverage');
            expect((result as any).properties.grid.dimension).toBe(2);
            expect((result as any).properties.grid.limits.low).toEqual([0, 0]);
            expect((result as any).properties.grid.limits.high).toEqual([99, 199]);
            expect((result as any).properties.grid.origin).toEqual([10.0, 1.0]);
            expect((result as any).properties.grid.offsetVectors).toHaveLength(2);
            expect((result as any).properties.dataFile.fileName).toBe('coverage_data.tif');
            expect((result as any).bbox).toEqual([1, 1, 10, 20]);
        });

        // Note: GMLJP2 namespaces require special handling - skipped for now
    });

    describe('GeoTIFF Metadata Extraction', () => {
        it('should extract GeoTIFF metadata from RectifiedGridCoverage', async () => {
            const gml = `
                <gml:RectifiedGridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" gml:id="RGC01">
                    <gml:boundedBy>
                        <gml:Envelope srsName="EPSG:4326">
                            <gml:lowerCorner>1.0 1.0</gml:lowerCorner>
                            <gml:upperCorner>10.0 20.0</gml:upperCorner>
                        </gml:Envelope>
                    </gml:boundedBy>
                    <gml:domainSet>
                        <gml:RectifiedGrid gml:id="RG01" dimension="2" srsName="EPSG:4326">
                            <gml:limits>
                                <gml:GridEnvelope>
                                    <gml:low>0 0</gml:low>
                                    <gml:high>99 199</gml:high>
                                </gml:GridEnvelope>
                            </gml:limits>
                            <gml:origin>
                                <gml:Point>
                                    <gml:pos>10.0 1.0</gml:pos>
                                </gml:Point>
                            </gml:origin>
                            <gml:offsetVector>0 0.1</gml:offsetVector>
                            <gml:offsetVector>-0.1 0</gml:offsetVector>
                        </gml:RectifiedGrid>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>data.tif</gml:fileName>
                        </gml:File>
                    </gml:rangeSet>
                </gml:RectifiedGridCoverage>
            `;

            const parser = new GmlParser();
            await parser.parse(gml); // Parse to validate

            // Access the internal GML object for metadata extraction
            const geotiffMetadata = extractGeoTiffMetadata({
                type: 'RectifiedGridCoverage',
                id: 'RGC01',
                boundedBy: {
                    type: 'Envelope',
                    bbox: [1, 1, 10, 20],
                    srsName: 'EPSG:4326',
                    version: '3.2',
                },
                domainSet: {
                    dimension: 2,
                    srsName: 'EPSG:4326',
                    limits: { low: [0, 0], high: [99, 199] },
                    origin: [10.0, 1.0],
                    offsetVectors: [[0, 0.1], [-0.1, 0]],
                },
                rangeSet: { file: { fileName: 'data.tif' } },
                version: '3.2',
            });

            expect(geotiffMetadata.width).toBe(100);
            expect(geotiffMetadata.height).toBe(200);
            expect(geotiffMetadata.bbox).toEqual([1, 1, 10, 20]);
            expect(geotiffMetadata.crs).toBe('EPSG:4326');
            expect(geotiffMetadata.origin).toEqual([10.0, 1.0]);
            expect(geotiffMetadata.transform).toHaveLength(6);
            expect(geotiffMetadata.resolution).toHaveLength(2);
        });

        it('should convert between pixel and world coordinates', async () => {
            const metadata = {
                width: 100,
                height: 200,
                bbox: [1, 1, 10, 20] as [number, number, number, number],
                crs: 'EPSG:4326',
                origin: [10.0, 1.0],
                // Affine transform: [a, b, c, d, e, f]
                // x_geo = a * x_pixel + b * y_pixel + c
                // y_geo = d * x_pixel + e * y_pixel + f
                transform: [0, 0.1, 10.0, -0.1, 0, 1.0],
            };

            const worldCoords = pixelToWorld(50, 100, metadata);
            expect(worldCoords).toBeTruthy();
            // x_geo = 0 * 50 + 0.1 * 100 + 10.0 = 20.0
            // y_geo = -0.1 * 50 + 0 * 100 + 1.0 = -4.0
            expect(worldCoords?.[0]).toBeCloseTo(20.0, 1);
            expect(worldCoords?.[1]).toBeCloseTo(-4.0, 1);

            const pixelCoords = worldToPixel(worldCoords![0], worldCoords![1], metadata);
            expect(pixelCoords).toBeTruthy();
            expect(pixelCoords?.[0]).toBeCloseTo(50, 1);
            expect(pixelCoords?.[1]).toBeCloseTo(100, 1);
        });
    });

    describe('MultiPointCoverage', () => {
        it('should parse MultiPointCoverage to GeoJSON Feature', async () => {
            const gml = `
                <gml:MultiPointCoverage xmlns:gml="http://www.opengis.net/gml/3.2" gml:id="MPC01">
                    <gml:boundedBy>
                        <gml:Envelope srsName="EPSG:4326">
                            <gml:lowerCorner>0.0 0.0</gml:lowerCorner>
                            <gml:upperCorner>10.0 10.0</gml:upperCorner>
                        </gml:Envelope>
                    </gml:boundedBy>
                    <gml:domainSet>
                        <gml:MultiPoint gml:id="MP01" srsName="EPSG:4326">
                            <gml:pointMember>
                                <gml:Point gml:id="P1"><gml:pos>1.0 2.0</gml:pos></gml:Point>
                            </gml:pointMember>
                            <gml:pointMember>
                                <gml:Point gml:id="P2"><gml:pos>3.0 4.0</gml:pos></gml:Point>
                            </gml:pointMember>
                            <gml:pointMember>
                                <gml:Point gml:id="P3"><gml:pos>5.0 6.0</gml:pos></gml:Point>
                            </gml:pointMember>
                        </gml:MultiPoint>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>sensor_data.csv</gml:fileName>
                            <gml:fileStructure>CSV</gml:fileStructure>
                        </gml:File>
                    </gml:rangeSet>
                </gml:MultiPointCoverage>
            `;

            const parser = new GmlParser();
            const result = await parser.parse(gml);

            expect(result.type).toBe('Feature');
            expect((result as any).properties.coverageType).toBe('MultiPointCoverage');
            expect((result as any).properties.points.count).toBe(3);
            expect((result as any).properties.dataFile.fileName).toBe('sensor_data.csv');
            expect((result as any).bbox).toEqual([0, 0, 10, 10]);
            expect((result as any).geometry.type).toBe('MultiPoint');
            expect((result as any).geometry.coordinates).toHaveLength(3);
            expect((result as any).geometry.coordinates[0]).toEqual([1, 2]);
            expect((result as any).geometry.coordinates[1]).toEqual([3, 4]);
            expect((result as any).geometry.coordinates[2]).toEqual([5, 6]);
        });

        it('should parse MultiPointCoverage to CIS JSON', async () => {
            const gml = `
                <gml:MultiPointCoverage xmlns:gml="http://www.opengis.net/gml/3.2" gml:id="MPC02">
                    <gml:domainSet>
                        <gml:MultiPoint gml:id="MP02" srsName="EPSG:4326">
                            <gml:pointMember>
                                <gml:Point><gml:pos>1.0 2.0</gml:pos></gml:Point>
                            </gml:pointMember>
                            <gml:pointMember>
                                <gml:Point><gml:pos>3.0 4.0</gml:pos></gml:Point>
                            </gml:pointMember>
                        </gml:MultiPoint>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>data.json</gml:fileName>
                        </gml:File>
                    </gml:rangeSet>
                </gml:MultiPointCoverage>
            `;

            const parser = new GmlParser('cis-json');
            const result = await parser.parse(gml) as any;

            expect(result['@context']).toBe('http://www.opengis.net/cis/1.1/json');
            expect(result.type).toBe('CoverageByDomainAndRangeType');
            expect(result.id).toBe('MPC02');
            expect(result.domainSet.type).toBe('MultiPoint');
            expect(result.domainSet.pointMember).toHaveLength(2);
            expect(result.rangeSet.dataReference.fileURL).toBe('data.json');
        });

        it('should parse MultiPointCoverage to CoverageJSON', async () => {
            const gml = `
                <gml:MultiPointCoverage xmlns:gml="http://www.opengis.net/gml/3.2" gml:id="MPC03">
                    <gml:domainSet>
                        <gml:MultiPoint gml:id="MP03" srsName="EPSG:4326">
                            <gml:pointMember>
                                <gml:Point><gml:pos>1.0 2.0</gml:pos></gml:Point>
                            </gml:pointMember>
                            <gml:pointMember>
                                <gml:Point><gml:pos>3.0 4.0</gml:pos></gml:Point>
                            </gml:pointMember>
                        </gml:MultiPoint>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>data.json</gml:fileName>
                        </gml:File>
                    </gml:rangeSet>
                </gml:MultiPointCoverage>
            `;

            const parser = new GmlParser('coveragejson');
            const result = await parser.parse(gml) as any;

            expect(result.type).toBe('Coverage');
            expect(result.domain.type).toBe('Domain');
            expect(result.domain.domainType).toBe('PointSeries');
            expect(result.domain.axes.composite).toBeDefined();
            expect(result.domain.axes.composite.values).toHaveLength(2);
            expect(result.domain.axes.composite.values[0]).toEqual([1, 2]);
            expect(result.domain.axes.composite.values[1]).toEqual([3, 4]);
            expect(result.parameters).toBeDefined();
            expect(result.ranges).toBeDefined();
        });
    });

    describe('Multi-band RangeType Support', () => {
        it('should parse RectifiedGridCoverage with RGB bands', async () => {
            const gml = `
                <gml:RectifiedGridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:swe="http://www.opengis.net/swe/2.0" gml:id="RGB_COVERAGE">
                    <gml:domainSet>
                        <gml:RectifiedGrid dimension="2" srsName="EPSG:4326">
                            <gml:limits>
                                <gml:GridEnvelope>
                                    <gml:low>0 0</gml:low>
                                    <gml:high>100 100</gml:high>
                                </gml:GridEnvelope>
                            </gml:limits>
                            <gml:origin>
                                <gml:Point><gml:pos>0 0</gml:pos></gml:Point>
                            </gml:origin>
                            <gml:offsetVector>1 0</gml:offsetVector>
                            <gml:offsetVector>0 1</gml:offsetVector>
                        </gml:RectifiedGrid>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>rgb_image.tif</gml:fileName>
                        </gml:File>
                    </gml:rangeSet>
                    <gmlcov:rangeType>
                        <swe:DataRecord>
                            <swe:field name="red">
                                <swe:Quantity uom="W.m-2.sr-1">
                                    <swe:description>Red band (620-750 nm)</swe:description>
                                    <swe:dataType>uint8</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="green">
                                <swe:Quantity uom="W.m-2.sr-1">
                                    <swe:description>Green band (495-570 nm)</swe:description>
                                    <swe:dataType>uint8</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="blue">
                                <swe:Quantity uom="W.m-2.sr-1">
                                    <swe:description>Blue band (450-495 nm)</swe:description>
                                    <swe:dataType>uint8</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                        </swe:DataRecord>
                    </gmlcov:rangeType>
                </gml:RectifiedGridCoverage>
            `;

            const parser = new GmlParser();
            const result = await parser.parse(gml) as any;

            expect(result.type).toBe('Feature');
            expect(result.properties.coverageType).toBe('RectifiedGridCoverage');
            expect(result.properties.rangeType).toBeDefined();
            expect(result.properties.rangeType.field).toHaveLength(3);

            // Check red band
            expect(result.properties.rangeType.field[0].name).toBe('red');
            expect(result.properties.rangeType.field[0].dataType).toBe('uint8');
            expect(result.properties.rangeType.field[0].uom).toBe('W.m-2.sr-1');
            expect(result.properties.rangeType.field[0].description).toBe('Red band (620-750 nm)');

            // Check green band
            expect(result.properties.rangeType.field[1].name).toBe('green');
            expect(result.properties.rangeType.field[1].description).toBe('Green band (495-570 nm)');

            // Check blue band
            expect(result.properties.rangeType.field[2].name).toBe('blue');
            expect(result.properties.rangeType.field[2].description).toBe('Blue band (450-495 nm)');
        });

        it('should parse GridCoverage with Landsat-8 hyperspectral bands', async () => {
            const gml = `
                <gml:GridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:swe="http://www.opengis.net/swe/2.0" gml:id="LANDSAT8">
                    <gml:domainSet>
                        <gml:Grid dimension="2">
                            <gml:limits>
                                <gml:GridEnvelope>
                                    <gml:low>0 0</gml:low>
                                    <gml:high>7760 7600</gml:high>
                                </gml:GridEnvelope>
                            </gml:limits>
                        </gml:Grid>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>LC08_L1TP.tif</gml:fileName>
                        </gml:File>
                    </gml:rangeSet>
                    <gmlcov:rangeType>
                        <swe:DataRecord>
                            <swe:field name="coastal_aerosol">
                                <swe:Quantity uom="W/(m2.sr.μm)">
                                    <swe:description>Band 1 - Coastal/Aerosol (0.433-0.453 μm)</swe:description>
                                    <swe:dataType>uint16</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="blue">
                                <swe:Quantity uom="W/(m2.sr.μm)">
                                    <swe:description>Band 2 - Blue (0.450-0.515 μm)</swe:description>
                                    <swe:dataType>uint16</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="green">
                                <swe:Quantity uom="W/(m2.sr.μm)">
                                    <swe:description>Band 3 - Green (0.525-0.600 μm)</swe:description>
                                    <swe:dataType>uint16</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="red">
                                <swe:Quantity uom="W/(m2.sr.μm)">
                                    <swe:description>Band 4 - Red (0.630-0.680 μm)</swe:description>
                                    <swe:dataType>uint16</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="nir">
                                <swe:Quantity uom="W/(m2.sr.μm)">
                                    <swe:description>Band 5 - NIR (0.845-0.885 μm)</swe:description>
                                    <swe:dataType>uint16</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="swir1">
                                <swe:Quantity uom="W/(m2.sr.μm)">
                                    <swe:description>Band 6 - SWIR 1 (1.560-1.660 μm)</swe:description>
                                    <swe:dataType>uint16</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="swir2">
                                <swe:Quantity uom="W/(m2.sr.μm)">
                                    <swe:description>Band 7 - SWIR 2 (2.100-2.300 μm)</swe:description>
                                    <swe:dataType>uint16</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                        </swe:DataRecord>
                    </gmlcov:rangeType>
                </gml:GridCoverage>
            `;

            const parser = new GmlParser();
            const result = await parser.parse(gml) as any;

            expect(result.type).toBe('Feature');
            expect(result.properties.coverageType).toBe('GridCoverage');
            expect(result.properties.rangeType).toBeDefined();
            expect(result.properties.rangeType.field).toHaveLength(7);

            // Verify all band names
            const bandNames = result.properties.rangeType.field.map((f: any) => f.name);
            expect(bandNames).toEqual([
                'coastal_aerosol',
                'blue',
                'green',
                'red',
                'nir',
                'swir1',
                'swir2'
            ]);

            // Verify all bands have uint16 dataType
            result.properties.rangeType.field.forEach((field: any) => {
                expect(field.dataType).toBe('uint16');
                expect(field.uom).toBe('W/(m2.sr.μm)');
                expect(field.description).toContain('Band');
            });
        });

        it('should parse MultiPointCoverage with temperature and humidity bands', async () => {
            const gml = `
                <gml:MultiPointCoverage xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:swe="http://www.opengis.net/swe/2.0" gml:id="WEATHER_STATIONS">
                    <gml:domainSet>
                        <gml:MultiPoint srsName="EPSG:4326">
                            <gml:pointMember>
                                <gml:Point><gml:pos>52.5 13.4</gml:pos></gml:Point>
                            </gml:pointMember>
                            <gml:pointMember>
                                <gml:Point><gml:pos>48.1 11.6</gml:pos></gml:Point>
                            </gml:pointMember>
                            <gml:pointMember>
                                <gml:Point><gml:pos>50.9 6.9</gml:pos></gml:Point>
                            </gml:pointMember>
                        </gml:MultiPoint>
                    </gml:domainSet>
                    <gml:rangeSet>
                        <gml:File>
                            <gml:rangeParameters/>
                            <gml:fileName>weather_data.csv</gml:fileName>
                        </gml:File>
                    </gml:rangeSet>
                    <gmlcov:rangeType>
                        <swe:DataRecord>
                            <swe:field name="temperature">
                                <swe:Quantity uom="Cel">
                                    <swe:description>Air temperature at 2m height</swe:description>
                                    <swe:dataType>float32</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="humidity">
                                <swe:Quantity uom="%">
                                    <swe:description>Relative humidity</swe:description>
                                    <swe:dataType>float32</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="pressure">
                                <swe:Quantity uom="hPa">
                                    <swe:description>Atmospheric pressure</swe:description>
                                    <swe:dataType>float32</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                            <swe:field name="wind_speed">
                                <swe:Quantity uom="m/s">
                                    <swe:description>Wind speed at 10m height</swe:description>
                                    <swe:dataType>float32</swe:dataType>
                                </swe:Quantity>
                            </swe:field>
                        </swe:DataRecord>
                    </gmlcov:rangeType>
                </gml:MultiPointCoverage>
            `;

            const parser = new GmlParser();
            const result = await parser.parse(gml) as any;

            expect(result.type).toBe('Feature');
            expect(result.properties.coverageType).toBe('MultiPointCoverage');
            expect(result.properties.rangeType).toBeDefined();
            expect(result.properties.rangeType.field).toHaveLength(4);

            // Verify sensor parameters
            expect(result.properties.rangeType.field[0].name).toBe('temperature');
            expect(result.properties.rangeType.field[0].uom).toBe('Cel');

            expect(result.properties.rangeType.field[1].name).toBe('humidity');
            expect(result.properties.rangeType.field[1].uom).toBe('%');

            expect(result.properties.rangeType.field[2].name).toBe('pressure');
            expect(result.properties.rangeType.field[2].uom).toBe('hPa');

            expect(result.properties.rangeType.field[3].name).toBe('wind_speed');
            expect(result.properties.rangeType.field[3].uom).toBe('m/s');

            // Verify MultiPoint geometry
            expect(result.geometry.type).toBe('MultiPoint');
            expect(result.geometry.coordinates).toHaveLength(3);
        });

        it('should extract GeoTIFF metadata from multi-band coverage', async () => {
            const coverage = {
                type: 'RectifiedGridCoverage' as const,
                id: 'RGB',
                domainSet: {
                    dimension: 2,
                    srsName: 'EPSG:4326',
                    limits: { low: [0, 0], high: [99, 99] },
                    origin: [0, 0],
                    offsetVectors: [[0.1, 0], [0, 0.1]],
                },
                rangeSet: { file: { fileName: 'rgb.tif' } },
                rangeType: {
                    field: [
                        { name: 'red', dataType: 'uint8', uom: 'W.m-2.sr-1' },
                        { name: 'green', dataType: 'uint8', uom: 'W.m-2.sr-1' },
                        { name: 'blue', dataType: 'uint8', uom: 'W.m-2.sr-1' },
                    ],
                },
                version: '3.2' as const,
            };

            const metadata = extractGeoTiffMetadata(coverage);

            expect(metadata.bands).toBe(3);
            expect(metadata.bandInfo).toHaveLength(3);
            expect(metadata.bandInfo?.[0].name).toBe('red');
            expect(metadata.bandInfo?.[0].dataType).toBe('uint8');
            expect(metadata.bandInfo?.[0].uom).toBe('W.m-2.sr-1');
            expect(metadata.bandInfo?.[1].name).toBe('green');
            expect(metadata.bandInfo?.[2].name).toBe('blue');
        });
    });
});
