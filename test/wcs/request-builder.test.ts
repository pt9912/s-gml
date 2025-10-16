import {
    WcsRequestBuilder,
    buildWcsGetCoverageUrl,
    buildWcsGetCoverageXml,
} from '../../src/wcs/request-builder.js';

describe('WcsRequestBuilder', () => {
    describe('GET Request URL Generation', () => {
        it('should build basic GetCoverage URL for WCS 2.0.1', () => {
            const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
            });

            expect(url).toContain('service=WCS');
            expect(url).toContain('version=2.0.1');
            expect(url).toContain('request=GetCoverage');
            expect(url).toContain('coverageId=test_coverage');
            expect(url).toContain('format=image%2Ftiff');
        });

        it('should build GetCoverage URL with custom format', () => {
            const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                format: 'image/png',
            });

            expect(url).toContain('format=image%2Fpng');
        });

        it('should use correct parameter name for WCS 1.1.0', () => {
            const builder = new WcsRequestBuilder('https://example.com/wcs', '1.1.0');
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
            });

            expect(url).toContain('version=1.1.0');
            expect(url).toContain('identifier=test_coverage');
            expect(url).not.toContain('coverageId=');
        });

        it('should use correct parameter name for WCS 1.0.0', () => {
            const builder = new WcsRequestBuilder('https://example.com/wcs', '1.0.0');
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
            });

            expect(url).toContain('version=1.0.0');
            expect(url).toContain('coverage=test_coverage');
            expect(url).not.toContain('coverageId=');
        });

        it('should handle baseUrl without trailing ?', () => {
            const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
            });

            expect(url.startsWith('https://example.com/wcs?')).toBe(true);
        });

        it('should handle baseUrl with trailing ?', () => {
            const builder = new WcsRequestBuilder('https://example.com/wcs?', '2.0.1');
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
            });

            expect(url.startsWith('https://example.com/wcs?')).toBe(true);
            expect(url).not.toContain('??');
        });
    });

    describe('Spatial Subsetting', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build URL with spatial subset (bbox)', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                subset: [
                    { axis: 'Lat', min: -10, max: 10 },
                    { axis: 'Long', min: 30, max: 50 },
                ],
            });

            expect(url).toContain('subset=Lat%28-10%2C10%29');
            expect(url).toContain('subset=Long%2830%2C50%29');
        });

        it('should build URL with point subsetting', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                subset: [
                    { axis: 'Lat', value: 52.5 },
                    { axis: 'Long', value: 13.4 },
                ],
            });

            expect(url).toContain('subset=Lat%2852.5%29');
            expect(url).toContain('subset=Long%2813.4%29');
        });

        it('should build URL with lower bound only', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                subset: [{ axis: 'time', min: '2024-01-01' }],
            });

            expect(url).toContain('subset=time%282024-01-01%2C*%29');
        });

        it('should build URL with upper bound only', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                subset: [{ axis: 'time', max: '2024-12-31' }],
            });

            expect(url).toContain('subset=time%28*%2C2024-12-31%29');
        });
    });

    describe('Temporal Subsetting', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build URL with temporal subset (ISO 8601)', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'weather_data',
                subset: [
                    { axis: 'time', min: '2024-01-01T00:00:00Z', max: '2024-01-31T23:59:59Z' },
                ],
            });

            expect(url).toContain('subset=time%282024-01-01T00%3A00%3A00Z%2C2024-01-31T23%3A59%3A59Z%29');
        });

        it('should build URL with elevation subsetting', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'atmosphere_3d',
                subset: [
                    { axis: 'elevation', min: 0, max: 5000 },
                ],
            });

            expect(url).toContain('subset=elevation%280%2C5000%29');
        });
    });

    describe('Scaling', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build URL with scale factor', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                scaling: { type: 'factor', value: 0.5 },
            });

            expect(url).toContain('scaleFactor=0.5');
        });

        it('should build URL with scale size (single value)', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                scaling: { type: 'size', value: 500 },
            });

            expect(url).toContain('scaleSize=500');
        });

        it('should build URL with scale size (axis-specific)', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                scaling: { type: 'size', value: [1200, 800] },
            });

            expect(url).toContain('scaleSize=axis1%281200%29%2Caxis2%28800%29');
        });

        it('should build URL with scale extent', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                scaling: { type: 'extent', value: [-180, -90, 180, 90] },
            });

            expect(url).toContain('scaleExtent=axis1%28-180%2C-90%29%2Caxis2%28180%2C90%29');
        });
    });

    describe('Range Subsetting', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build URL with range subset (band selection)', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'landsat8',
                rangeSubset: ['red', 'green', 'blue'],
            });

            expect(url).toContain('rangeSubset=red%2Cgreen%2Cblue');
        });

        it('should build URL with single band', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'sentinel2',
                rangeSubset: ['B8A'],
            });

            expect(url).toContain('rangeSubset=B8A');
        });
    });

    describe('CRS Transformation', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build URL with output CRS', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                outputCrs: 'EPSG:3857',
            });

            expect(url).toContain('outputCrs=EPSG%3A3857');
        });

        it('should build URL with subsetting CRS', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                subsettingCrs: 'EPSG:4326',
            });

            expect(url).toContain('subsettingCrs=EPSG%3A4326');
        });

        it('should build URL with both output and subsetting CRS', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                outputCrs: 'EPSG:3857',
                subsettingCrs: 'EPSG:4326',
            });

            expect(url).toContain('outputCrs=EPSG%3A3857');
            expect(url).toContain('subsettingCrs=EPSG%3A4326');
        });
    });

    describe('Interpolation', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build URL with nearest neighbor interpolation', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                interpolation: 'nearest',
            });

            expect(url).toContain('interpolation=nearest');
        });

        it('should build URL with bilinear interpolation', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                interpolation: 'linear',
            });

            expect(url).toContain('interpolation=linear');
        });
    });

    describe('Media Type Parameters', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build URL with media type parameters', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'test_coverage',
                format: 'image/tiff',
                mediaType: {
                    compression: 'LZW',
                    tilewidth: '256',
                    tileheight: '256',
                },
            });

            expect(url).toContain('compression=LZW');
            expect(url).toContain('tilewidth=256');
            expect(url).toContain('tileheight=256');
        });
    });

    describe('Complex Scenarios', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build complete Landsat-8 GetCoverage URL', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'LC08_L1TP_193024_20240101',
                format: 'image/tiff',
                subset: [
                    { axis: 'Lat', min: -34.0, max: -33.0 },
                    { axis: 'Long', min: 18.0, max: 19.0 },
                    { axis: 'time', value: '2024-01-01T10:30:00Z' },
                ],
                rangeSubset: ['B4', 'B3', 'B2'], // RGB
                scaling: { type: 'size', value: [1024, 1024] },
                outputCrs: 'EPSG:4326',
                interpolation: 'bilinear',
                mediaType: {
                    compression: 'DEFLATE',
                },
            });

            expect(url).toContain('coverageId=LC08_L1TP_193024_20240101');
            expect(url).toContain('format=image%2Ftiff');
            expect(url).toContain('subset=Lat%28-34%2C-33%29');
            expect(url).toContain('subset=Long%2818%2C19%29');
            expect(url).toContain('subset=time%282024-01-01T10%3A30%3A00Z%29');
            expect(url).toContain('rangeSubset=B4%2CB3%2CB2');
            expect(url).toContain('scaleSize=axis1%281024%29%2Caxis2%281024%29');
            expect(url).toContain('outputCrs=EPSG%3A4326');
            expect(url).toContain('interpolation=bilinear');
            expect(url).toContain('compression=DEFLATE');
        });

        it('should build weather forecast GetCoverage URL with temporal range', () => {
            const url = builder.buildGetCoverageUrl({
                coverageId: 'GFS_TEMP_2M',
                format: 'application/netcdf',
                subset: [
                    { axis: 'Lat', min: 40, max: 55 },
                    { axis: 'Long', min: -10, max: 10 },
                    { axis: 'time', min: '2024-10-16T00:00:00Z', max: '2024-10-23T00:00:00Z' },
                ],
                rangeSubset: ['temperature', 'precipitation'],
                outputCrs: 'EPSG:4326',
            });

            expect(url).toContain('coverageId=GFS_TEMP_2M');
            expect(url).toContain('format=application%2Fnetcdf');
            expect(url).toContain('subset=time%282024-10-16T00%3A00%3A00Z%2C2024-10-23T00%3A00%3A00Z%29');
            expect(url).toContain('rangeSubset=temperature%2Cprecipitation');
        });
    });

    describe('XML POST Request Generation', () => {
        const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

        it('should build basic GetCoverage XML', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'test_coverage',
            });

            expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xml).toContain('<wcs:GetCoverage');
            expect(xml).toContain('xmlns:wcs="http://www.opengis.net/wcs/2.0"');
            expect(xml).toContain('<wcs:CoverageId>test_coverage</wcs:CoverageId>');
            expect(xml).toContain('</wcs:GetCoverage>');
        });

        it('should build XML with format', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'test_coverage',
                format: 'image/png',
            });

            expect(xml).toContain('<wcs:format>image/png</wcs:format>');
        });

        it('should build XML with spatial subsetting', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'test_coverage',
                subset: [
                    { axis: 'Lat', min: -10, max: 10 },
                    { axis: 'Long', min: 30, max: 50 },
                ],
            });

            expect(xml).toContain('<wcs:DimensionTrim>');
            expect(xml).toContain('<wcs:Dimension>Lat</wcs:Dimension>');
            expect(xml).toContain('<wcs:TrimLow>-10</wcs:TrimLow>');
            expect(xml).toContain('<wcs:TrimHigh>10</wcs:TrimHigh>');
            expect(xml).toContain('<wcs:Dimension>Long</wcs:Dimension>');
            expect(xml).toContain('<wcs:TrimLow>30</wcs:TrimLow>');
            expect(xml).toContain('<wcs:TrimHigh>50</wcs:TrimHigh>');
        });

        it('should build XML with point subsetting', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'test_coverage',
                subset: [{ axis: 'time', value: '2024-10-16T00:00:00Z' }],
            });

            expect(xml).toContain('<wcs:Dimension>time</wcs:Dimension>');
            expect(xml).toContain('<wcs:TrimLow>2024-10-16T00:00:00Z</wcs:TrimLow>');
            expect(xml).toContain('<wcs:TrimHigh>2024-10-16T00:00:00Z</wcs:TrimHigh>');
        });

        it('should build XML with scale factor', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'test_coverage',
                scaling: { type: 'factor', value: 0.5 },
            });

            expect(xml).toContain('<wcs:Extension>');
            expect(xml).toContain('<scal:ScaleByFactor>');
            expect(xml).toContain('<scal:scaleFactor>0.5</scal:scaleFactor>');
        });

        it('should build XML with scale size (array)', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'test_coverage',
                scaling: { type: 'size', value: [1200, 800] },
            });

            expect(xml).toContain('<scal:ScaleToSize>');
            expect(xml).toContain('<scal:TargetAxisSize><scal:axis>axis1</scal:axis><scal:targetSize>1200</scal:targetSize></scal:TargetAxisSize>');
            expect(xml).toContain('<scal:TargetAxisSize><scal:axis>axis2</scal:axis><scal:targetSize>800</scal:targetSize></scal:TargetAxisSize>');
        });

        it('should build XML with range subsetting', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'landsat8',
                rangeSubset: ['red', 'green', 'blue'],
            });

            expect(xml).toContain('<wcs:Extension>');
            expect(xml).toContain('<rsub:RangeSubset>');
            expect(xml).toContain('<rsub:RangeItem>');
            expect(xml).toContain('<rsub:RangeComponent>red</rsub:RangeComponent>');
            expect(xml).toContain('<rsub:RangeComponent>green</rsub:RangeComponent>');
            expect(xml).toContain('<rsub:RangeComponent>blue</rsub:RangeComponent>');
        });

        it('should escape XML special characters', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'test<>&"\'coverage',
            });

            expect(xml).toContain('test&lt;&gt;&amp;&quot;&apos;coverage');
            expect(xml).not.toContain('test<>&"\'coverage');
        });

        it('should throw error for XML generation with non-2.0 versions', () => {
            const builder110 = new WcsRequestBuilder('https://example.com/wcs', '1.1.0');

            expect(() => {
                builder110.buildGetCoverageXml({
                    coverageId: 'test_coverage',
                });
            }).toThrow('XML POST requests are only supported for WCS 2.0');
        });

        it('should build complete Landsat-8 GetCoverage XML', () => {
            const xml = builder.buildGetCoverageXml({
                coverageId: 'LC08_L1TP_193024_20240101',
                format: 'image/tiff',
                subset: [
                    { axis: 'Lat', min: -34.0, max: -33.0 },
                    { axis: 'Long', min: 18.0, max: 19.0 },
                    { axis: 'time', value: '2024-01-01T10:30:00Z' },
                ],
                rangeSubset: ['B4', 'B3', 'B2'],
                scaling: { type: 'size', value: [1024, 1024] },
            });

            expect(xml).toContain('<wcs:CoverageId>LC08_L1TP_193024_20240101</wcs:CoverageId>');
            expect(xml).toContain('<wcs:format>image/tiff</wcs:format>');
            expect(xml).toContain('<wcs:Dimension>Lat</wcs:Dimension>');
            expect(xml).toContain('<wcs:Dimension>Long</wcs:Dimension>');
            expect(xml).toContain('<wcs:Dimension>time</wcs:Dimension>');
            expect(xml).toContain('<rsub:RangeComponent>B4</rsub:RangeComponent>');
            expect(xml).toContain('<scal:targetSize>1024</scal:targetSize>');
        });
    });

    describe('Helper Functions', () => {
        it('should build URL using helper function', () => {
            const url = buildWcsGetCoverageUrl(
                'https://example.com/wcs',
                {
                    coverageId: 'test_coverage',
                    format: 'image/png',
                },
                '2.0.1'
            );

            expect(url).toContain('service=WCS');
            expect(url).toContain('version=2.0.1');
            expect(url).toContain('coverageId=test_coverage');
            expect(url).toContain('format=image%2Fpng');
        });

        it('should build XML using helper function', () => {
            const xml = buildWcsGetCoverageXml(
                {
                    coverageId: 'test_coverage',
                    format: 'image/tiff',
                },
                '2.0.1'
            );

            expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xml).toContain('<wcs:CoverageId>test_coverage</wcs:CoverageId>');
            expect(xml).toContain('<wcs:format>image/tiff</wcs:format>');
        });

        it('should use default version 2.0.1 for helper functions', () => {
            const url = buildWcsGetCoverageUrl('https://example.com/wcs', {
                coverageId: 'test_coverage',
            });

            expect(url).toContain('version=2.0.1');

            const xml = buildWcsGetCoverageXml({
                coverageId: 'test_coverage',
            });

            expect(xml).toContain('service="WCS" version="2.0.1"');
        });
    });
});
