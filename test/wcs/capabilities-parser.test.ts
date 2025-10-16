import {
    WcsCapabilitiesParser,
    parseWcsCapabilities,
} from '../../src/wcs/capabilities-parser.js';

describe('WcsCapabilitiesParser', () => {
    const parser = new WcsCapabilitiesParser();

    describe('WCS 2.0 Capabilities', () => {
        const wcs20Xml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/2.0"
                  xmlns:ows="http://www.opengis.net/ows/2.0"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="2.0.1" updateSequence="2024-10-16">
  <ows:ServiceIdentification>
    <ows:Title>Test WCS Server</ows:Title>
    <ows:Abstract>This is a test WCS 2.0 server for coverage data</ows:Abstract>
    <ows:Keywords>
      <ows:Keyword>WCS</ows:Keyword>
      <ows:Keyword>Coverage</ows:Keyword>
      <ows:Keyword>Remote Sensing</ows:Keyword>
    </ows:Keywords>
    <ows:ServiceType>WCS</ows:ServiceType>
    <ows:ServiceTypeVersion>2.0.1</ows:ServiceTypeVersion>
    <ows:ServiceTypeVersion>2.0.0</ows:ServiceTypeVersion>
    <ows:Fees>NONE</ows:Fees>
    <ows:AccessConstraints>NONE</ows:AccessConstraints>
  </ows:ServiceIdentification>

  <ows:ServiceProvider>
    <ows:ProviderName>Test Organization</ows:ProviderName>
    <ows:ProviderSite xlink:href="https://example.com"/>
    <ows:ServiceContact>
      <ows:IndividualName>John Doe</ows:IndividualName>
      <ows:PositionName>GIS Specialist</ows:PositionName>
      <ows:ContactInfo>
        <ows:Phone>
          <ows:Voice>+1-555-1234</ows:Voice>
        </ows:Phone>
        <ows:Address>
          <ows:DeliveryPoint>123 Main St</ows:DeliveryPoint>
          <ows:City>Springfield</ows:City>
          <ows:PostalCode>12345</ows:PostalCode>
          <ows:Country>USA</ows:Country>
          <ows:ElectronicMailAddress>john@example.com</ows:ElectronicMailAddress>
        </ows:Address>
      </ows:ContactInfo>
    </ows:ServiceContact>
  </ows:ServiceProvider>

  <ows:OperationsMetadata>
    <ows:Operation name="GetCapabilities">
      <ows:DCP>
        <ows:HTTP>
          <ows:Get xlink:href="https://example.com/wcs?"/>
          <ows:Post xlink:href="https://example.com/wcs"/>
        </ows:HTTP>
      </ows:DCP>
    </ows:Operation>
    <ows:Operation name="DescribeCoverage">
      <ows:DCP>
        <ows:HTTP>
          <ows:Get xlink:href="https://example.com/wcs?"/>
        </ows:HTTP>
      </ows:DCP>
    </ows:Operation>
    <ows:Operation name="GetCoverage">
      <ows:DCP>
        <ows:HTTP>
          <ows:Get xlink:href="https://example.com/wcs?"/>
          <ows:Post xlink:href="https://example.com/wcs"/>
        </ows:HTTP>
      </ows:DCP>
    </ows:Operation>
  </ows:OperationsMetadata>

  <wcs:ServiceMetadata>
    <wcs:formatSupported>image/tiff</wcs:formatSupported>
    <wcs:formatSupported>image/png</wcs:formatSupported>
    <wcs:formatSupported>application/netcdf</wcs:formatSupported>
    <wcs:crsSupported>http://www.opengis.net/def/crs/EPSG/0/4326</wcs:crsSupported>
    <wcs:crsSupported>http://www.opengis.net/def/crs/EPSG/0/3857</wcs:crsSupported>
  </wcs:ServiceMetadata>

  <wcs:Contents>
    <wcs:CoverageSummary>
      <wcs:CoverageId>LANDSAT8_SCENE</wcs:CoverageId>
      <wcs:CoverageSubtype>RectifiedGridCoverage</wcs:CoverageSubtype>
      <ows:Title>Landsat 8 Scene</ows:Title>
      <ows:Abstract>Landsat 8 multispectral imagery</ows:Abstract>
      <ows:Keywords>
        <ows:Keyword>Landsat</ows:Keyword>
        <ows:Keyword>Satellite</ows:Keyword>
      </ows:Keywords>
      <ows:WGS84BoundingBox>
        <ows:LowerCorner>-34.0 18.0</ows:LowerCorner>
        <ows:UpperCorner>-33.0 19.0</ows:UpperCorner>
      </ows:WGS84BoundingBox>
      <ows:BoundingBox crs="EPSG:4326">
        <ows:LowerCorner>-34.0 18.0</ows:LowerCorner>
        <ows:UpperCorner>-33.0 19.0</ows:UpperCorner>
      </ows:BoundingBox>
    </wcs:CoverageSummary>

    <wcs:CoverageSummary>
      <wcs:CoverageId>SENTINEL2_SCENE</wcs:CoverageId>
      <wcs:CoverageSubtype>RectifiedGridCoverage</wcs:CoverageSubtype>
      <ows:Title>Sentinel-2 Scene</ows:Title>
      <ows:Abstract>Sentinel-2 multispectral imagery</ows:Abstract>
      <ows:WGS84BoundingBox>
        <ows:LowerCorner>50.0 8.0</ows:LowerCorner>
        <ows:UpperCorner>52.0 10.0</ows:UpperCorner>
      </ows:WGS84BoundingBox>
    </wcs:CoverageSummary>
  </wcs:Contents>
</wcs:Capabilities>`;

        it('should parse WCS 2.0 capabilities', () => {
            const capabilities = parser.parse(wcs20Xml);

            expect(capabilities.version).toBe('2.0.1');
            expect(capabilities.updateSequence).toBe('2024-10-16');
        });

        it('should parse service identification', () => {
            const capabilities = parser.parse(wcs20Xml);

            expect(capabilities.serviceIdentification).toBeDefined();
            expect(capabilities.serviceIdentification?.title).toBe('Test WCS Server');
            expect(capabilities.serviceIdentification?.abstract).toBe('This is a test WCS 2.0 server for coverage data');
            expect(capabilities.serviceIdentification?.keywords).toEqual(['WCS', 'Coverage', 'Remote Sensing']);
            expect(capabilities.serviceIdentification?.serviceType).toBe('WCS');
            expect(capabilities.serviceIdentification?.serviceTypeVersion).toEqual(['2.0.1', '2.0.0']);
            expect(capabilities.serviceIdentification?.fees).toBe('NONE');
            expect(capabilities.serviceIdentification?.accessConstraints).toEqual(['NONE']);
        });

        it('should parse service provider', () => {
            const capabilities = parser.parse(wcs20Xml);

            expect(capabilities.serviceProvider).toBeDefined();
            expect(capabilities.serviceProvider?.providerName).toBe('Test Organization');
            expect(capabilities.serviceProvider?.providerSite).toBe('https://example.com');
            expect(capabilities.serviceProvider?.serviceContact?.individualName).toBe('John Doe');
            expect(capabilities.serviceProvider?.serviceContact?.positionName).toBe('GIS Specialist');
            expect(capabilities.serviceProvider?.serviceContact?.contactInfo?.phone).toBe('+1-555-1234');
            expect(capabilities.serviceProvider?.serviceContact?.contactInfo?.address?.city).toBe('Springfield');
            expect(capabilities.serviceProvider?.serviceContact?.contactInfo?.address?.email).toBe('john@example.com');
        });

        it('should parse operations metadata', () => {
            const capabilities = parser.parse(wcs20Xml);

            expect(capabilities.operations).toBeDefined();
            expect(capabilities.operations?.length).toBe(3);

            const getCapabilities = capabilities.operations?.find(op => op.name === 'GetCapabilities');
            expect(getCapabilities).toBeDefined();
            expect(getCapabilities?.getUrl).toBe('https://example.com/wcs?');
            expect(getCapabilities?.postUrl).toBe('https://example.com/wcs');

            const describeCoverage = capabilities.operations?.find(op => op.name === 'DescribeCoverage');
            expect(describeCoverage).toBeDefined();
            expect(describeCoverage?.getUrl).toBe('https://example.com/wcs?');

            const getCoverage = capabilities.operations?.find(op => op.name === 'GetCoverage');
            expect(getCoverage).toBeDefined();
            expect(getCoverage?.getUrl).toBe('https://example.com/wcs?');
            expect(getCoverage?.postUrl).toBe('https://example.com/wcs');
        });

        it('should parse coverage summaries', () => {
            const capabilities = parser.parse(wcs20Xml);

            expect(capabilities.coverages).toBeDefined();
            expect(capabilities.coverages.length).toBe(2);

            const landsat = capabilities.coverages[0];
            expect(landsat.coverageId).toBe('LANDSAT8_SCENE');
            expect(landsat.coverageSubtype).toBe('RectifiedGridCoverage');
            expect(landsat.title).toBe('Landsat 8 Scene');
            expect(landsat.abstract).toBe('Landsat 8 multispectral imagery');
            expect(landsat.keywords).toEqual(['Landsat', 'Satellite']);
            expect(landsat.wgs84BoundingBox).toEqual({
                lowerCorner: [-34.0, 18.0],
                upperCorner: [-33.0, 19.0],
            });
            expect(landsat.boundingBox).toEqual({
                crs: 'EPSG:4326',
                lowerCorner: [-34.0, 18.0],
                upperCorner: [-33.0, 19.0],
            });

            const sentinel = capabilities.coverages[1];
            expect(sentinel.coverageId).toBe('SENTINEL2_SCENE');
            expect(sentinel.title).toBe('Sentinel-2 Scene');
        });

        it('should parse formats and CRS', () => {
            const capabilities = parser.parse(wcs20Xml);

            expect(capabilities.formats).toEqual(['image/tiff', 'image/png', 'application/netcdf']);
            expect(capabilities.crs).toEqual([
                'http://www.opengis.net/def/crs/EPSG/0/4326',
                'http://www.opengis.net/def/crs/EPSG/0/3857',
            ]);
        });
    });

    describe('WCS 1.1 Capabilities', () => {
        const wcs11Xml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/1.1"
                  xmlns:ows="http://www.opengis.net/ows/1.1"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="1.1.0">
  <ows:ServiceIdentification>
    <ows:Title>WCS 1.1 Test Server</ows:Title>
    <ows:Abstract>Test server for WCS 1.1</ows:Abstract>
    <ows:ServiceType>WCS</ows:ServiceType>
    <ows:ServiceTypeVersion>1.1.0</ows:ServiceTypeVersion>
  </ows:ServiceIdentification>

  <ows:ServiceProvider>
    <ows:ProviderName>Test Provider</ows:ProviderName>
  </ows:ServiceProvider>

  <ows:OperationsMetadata>
    <ows:Operation name="GetCapabilities">
      <ows:DCP>
        <ows:HTTP>
          <ows:Get xlink:href="https://example.com/wcs11?"/>
        </ows:HTTP>
      </ows:DCP>
    </ows:Operation>
  </ows:OperationsMetadata>

  <wcs:Contents>
    <wcs:CoverageSummary>
      <ows:Title>Test Coverage</ows:Title>
      <ows:Identifier>TEST_COVERAGE</ows:Identifier>
      <ows:WGS84BoundingBox>
        <ows:LowerCorner>-10.0 30.0</ows:LowerCorner>
        <ows:UpperCorner>10.0 50.0</ows:UpperCorner>
      </ows:WGS84BoundingBox>
    </wcs:CoverageSummary>
  </wcs:Contents>
</wcs:Capabilities>`;

        it('should parse WCS 1.1 capabilities', () => {
            const capabilities = parser.parse(wcs11Xml);

            expect(capabilities.version).toBe('1.1.0');
            expect(capabilities.serviceIdentification?.title).toBe('WCS 1.1 Test Server');
            expect(capabilities.serviceProvider?.providerName).toBe('Test Provider');
            expect(capabilities.coverages.length).toBe(1);
            expect(capabilities.coverages[0].coverageId).toBe('TEST_COVERAGE');
            expect(capabilities.coverages[0].title).toBe('Test Coverage');
        });
    });

    describe('WCS 1.0 Capabilities', () => {
        const wcs10Xml = `<?xml version="1.0" encoding="UTF-8"?>
<WCS_Capabilities xmlns="http://www.opengis.net/wcs"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  xmlns:gml="http://www.opengis.net/gml"
                  version="1.0.0">
  <Service>
    <name>WCS</name>
    <label>Test WCS 1.0 Server</label>
    <description>A test WCS 1.0 server</description>
    <keywords>
      <keyword>WCS</keyword>
      <keyword>Coverage</keyword>
    </keywords>
    <responsibleParty>
      <organisationName>Test Org</organisationName>
    </responsibleParty>
  </Service>

  <Capability>
    <Request>
      <GetCapabilities>
        <DCPType>
          <HTTP>
            <Get>
              <OnlineResource xlink:href="https://example.com/wcs10?"/>
            </Get>
          </HTTP>
        </DCPType>
      </GetCapabilities>

      <DescribeCoverage>
        <DCPType>
          <HTTP>
            <Get>
              <OnlineResource xlink:href="https://example.com/wcs10?"/>
            </Get>
            <Post>
              <OnlineResource xlink:href="https://example.com/wcs10"/>
            </Post>
          </HTTP>
        </DCPType>
      </DescribeCoverage>

      <GetCoverage>
        <DCPType>
          <HTTP>
            <Get>
              <OnlineResource xlink:href="https://example.com/wcs10?"/>
            </Get>
          </HTTP>
        </DCPType>
      </GetCoverage>
    </Request>
  </Capability>

  <ContentMetadata>
    <CoverageOfferingBrief>
      <name>COVERAGE_1</name>
      <label>Test Coverage 1</label>
      <description>First test coverage</description>
      <lonLatEnvelope srsName="WGS84(DD)">
        <gml:pos>-5.0 40.0</gml:pos>
        <gml:pos>5.0 50.0</gml:pos>
      </lonLatEnvelope>
      <keywords>
        <keyword>test</keyword>
      </keywords>
    </CoverageOfferingBrief>

    <CoverageOfferingBrief>
      <name>COVERAGE_2</name>
      <label>Test Coverage 2</label>
      <lonLatEnvelope srsName="WGS84(DD)">
        <gml:pos>10.0 20.0</gml:pos>
        <gml:pos>20.0 30.0</gml:pos>
      </lonLatEnvelope>
    </CoverageOfferingBrief>
  </ContentMetadata>
</WCS_Capabilities>`;

        it('should parse WCS 1.0 capabilities', () => {
            const capabilities = parser.parse(wcs10Xml);

            expect(capabilities.version).toBe('1.0.0');
        });

        it('should parse WCS 1.0 service information', () => {
            const capabilities = parser.parse(wcs10Xml);

            expect(capabilities.serviceIdentification?.title).toBe('Test WCS 1.0 Server');
            expect(capabilities.serviceIdentification?.abstract).toBe('A test WCS 1.0 server');
            expect(capabilities.serviceIdentification?.keywords).toEqual(['WCS', 'Coverage']);
            expect(capabilities.serviceProvider?.providerName).toBe('Test Org');
        });

        it('should parse WCS 1.0 operations', () => {
            const capabilities = parser.parse(wcs10Xml);

            expect(capabilities.operations).toBeDefined();
            expect(capabilities.operations?.length).toBe(3);

            const getCapabilities = capabilities.operations?.find(op => op.name === 'GetCapabilities');
            expect(getCapabilities).toBeDefined();
            expect(getCapabilities?.getUrl).toBe('https://example.com/wcs10?');

            const describeCoverage = capabilities.operations?.find(op => op.name === 'DescribeCoverage');
            expect(describeCoverage).toBeDefined();
            expect(describeCoverage?.getUrl).toBe('https://example.com/wcs10?');
            expect(describeCoverage?.postUrl).toBe('https://example.com/wcs10');

            const getCoverage = capabilities.operations?.find(op => op.name === 'GetCoverage');
            expect(getCoverage).toBeDefined();
            expect(getCoverage?.getUrl).toBe('https://example.com/wcs10?');
        });

        it('should parse WCS 1.0 coverage offerings', () => {
            const capabilities = parser.parse(wcs10Xml);

            expect(capabilities.coverages.length).toBe(2);

            const coverage1 = capabilities.coverages[0];
            expect(coverage1.coverageId).toBe('COVERAGE_1');
            expect(coverage1.title).toBe('Test Coverage 1');
            expect(coverage1.abstract).toBe('First test coverage');
            expect(coverage1.keywords).toEqual(['test']);
            expect(coverage1.wgs84BoundingBox).toEqual({
                lowerCorner: [-5.0, 40.0],
                upperCorner: [5.0, 50.0],
            });

            const coverage2 = capabilities.coverages[1];
            expect(coverage2.coverageId).toBe('COVERAGE_2');
            expect(coverage2.title).toBe('Test Coverage 2');
            expect(coverage2.wgs84BoundingBox).toEqual({
                lowerCorner: [10.0, 20.0],
                upperCorner: [20.0, 30.0],
            });
        });
    });

    describe('Helper function', () => {
        it('should parse capabilities using helper function', () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/2.0"
                  xmlns:ows="http://www.opengis.net/ows/2.0"
                  version="2.0.1">
  <ows:ServiceIdentification>
    <ows:Title>Helper Test</ows:Title>
  </ows:ServiceIdentification>
  <wcs:Contents>
    <wcs:CoverageSummary>
      <wcs:CoverageId>TEST</wcs:CoverageId>
    </wcs:CoverageSummary>
  </wcs:Contents>
</wcs:Capabilities>`;

            const capabilities = parseWcsCapabilities(xml);

            expect(capabilities.version).toBe('2.0.1');
            expect(capabilities.serviceIdentification?.title).toBe('Helper Test');
            expect(capabilities.coverages.length).toBe(1);
            expect(capabilities.coverages[0].coverageId).toBe('TEST');
        });
    });

    describe('Edge cases', () => {
        it('should handle minimal WCS 2.0 capabilities', () => {
            const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/2.0" version="2.0.1">
  <wcs:Contents>
    <wcs:CoverageSummary>
      <wcs:CoverageId>MINIMAL</wcs:CoverageId>
    </wcs:CoverageSummary>
  </wcs:Contents>
</wcs:Capabilities>`;

            const capabilities = parser.parse(minimalXml);

            expect(capabilities.version).toBe('2.0.1');
            expect(capabilities.coverages.length).toBe(1);
            expect(capabilities.coverages[0].coverageId).toBe('MINIMAL');
        });

        it('should handle empty coverage list', () => {
            const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/2.0" version="2.0.1">
  <wcs:Contents>
  </wcs:Contents>
</wcs:Capabilities>`;

            const capabilities = parser.parse(emptyXml);

            expect(capabilities.version).toBe('2.0.1');
            expect(capabilities.coverages).toEqual([]);
        });

        it('should throw error for unsupported version', () => {
            const unsupportedXml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/0.9" version="0.9.0">
</wcs:Capabilities>`;

            expect(() => {
                parser.parse(unsupportedXml);
            }).toThrow('Unsupported WCS version');
        });
    });
});
