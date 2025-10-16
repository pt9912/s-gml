/**
 * WCS GetCoverage Request Builder
 *
 * Generates WCS GetCoverage request URLs and XML POST bodies
 * following OGC WCS 2.0.1 specification
 *
 * Reference: OGC WCS 2.0 Interface Standard - Core (09-110r4)
 */

export type WcsVersion = '2.0.1' | '2.0.0' | '1.1.0' | '1.0.0';

export interface WcsSubset {
    axis: string;      // e.g., 'Lat', 'Long', 'time', 'elevation'
    min?: string | number;
    max?: string | number;
    value?: string | number; // For single point
}

export interface WcsScaling {
    type: 'size' | 'extent' | 'factor';
    value: number | number[];
}

export interface WcsGetCoverageOptions {
    // Required parameters
    coverageId: string;

    // Output format
    format?: string; // Default: 'image/tiff'

    // Subsetting (spatial, temporal, elevation, etc.)
    subset?: WcsSubset[];

    // Scaling
    scaling?: WcsScaling;

    // Range subsetting (bands/parameters)
    rangeSubset?: string[]; // e.g., ['red', 'green', 'blue']

    // CRS transformation
    outputCrs?: string; // e.g., 'EPSG:4326'
    subsettingCrs?: string;

    // Interpolation method
    interpolation?: string; // e.g., 'nearest', 'linear', 'cubic'

    // Media type parameters
    mediaType?: Record<string, string>;
}

export class WcsRequestBuilder {
    private baseUrl: string;
    private version: WcsVersion;

    constructor(baseUrl: string, version: WcsVersion = '2.0.1') {
        this.baseUrl = baseUrl.endsWith('?') ? baseUrl : `${baseUrl}?`;
        this.version = version;
    }

    /**
     * Build GetCoverage request URL (GET method)
     */
    buildGetCoverageUrl(options: WcsGetCoverageOptions): string {
        const params = new URLSearchParams();

        // Standard WCS parameters
        params.append('service', 'WCS');
        params.append('version', this.version);
        params.append('request', 'GetCoverage');

        // Coverage ID (parameter name depends on version)
        if (this.version.startsWith('2.0')) {
            params.append('coverageId', options.coverageId);
        } else if (this.version === '1.1.0') {
            params.append('identifier', options.coverageId);
        } else {
            params.append('coverage', options.coverageId);
        }

        // Format
        if (options.format) {
            params.append('format', options.format);
        } else {
            params.append('format', 'image/tiff');
        }

        // Subsetting
        if (options.subset && options.subset.length > 0) {
            options.subset.forEach(subset => {
                const subsetStr = this.buildSubsetString(subset);
                params.append('subset', subsetStr);
            });
        }

        // Scaling
        if (options.scaling) {
            const scalingParam = this.buildScalingParameter(options.scaling);
            if (scalingParam) {
                params.append(scalingParam.name, scalingParam.value);
            }
        }

        // Range subsetting
        if (options.rangeSubset && options.rangeSubset.length > 0) {
            params.append('rangeSubset', options.rangeSubset.join(','));
        }

        // Output CRS
        if (options.outputCrs) {
            params.append('outputCrs', options.outputCrs);
        }

        // Subsetting CRS
        if (options.subsettingCrs) {
            params.append('subsettingCrs', options.subsettingCrs);
        }

        // Interpolation
        if (options.interpolation) {
            params.append('interpolation', options.interpolation);
        }

        // Media type parameters
        if (options.mediaType) {
            Object.entries(options.mediaType).forEach(([key, value]) => {
                params.append(key, value);
            });
        }

        return this.baseUrl + params.toString();
    }

    /**
     * Build GetCoverage request XML (POST method) for WCS 2.0
     */
    buildGetCoverageXml(options: WcsGetCoverageOptions): string {
        if (!this.version.startsWith('2.0')) {
            throw new Error('XML POST requests are only supported for WCS 2.0');
        }

        const parts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<wcs:GetCoverage',
            ' xmlns:wcs="http://www.opengis.net/wcs/2.0"',
            ' xmlns:crs="http://www.opengis.net/wcs/crs/1.0"',
            ' xmlns:rsub="http://www.opengis.net/wcs/range-subsetting/1.0"',
            ' xmlns:scal="http://www.opengis.net/wcs/scaling/1.0"',
            ' xmlns:int="http://www.opengis.net/wcs/interpolation/1.0"',
            ` service="WCS" version="${this.version}">`,
            `  <wcs:CoverageId>${this.escapeXml(options.coverageId)}</wcs:CoverageId>`,
        ];

        // Format
        if (options.format) {
            parts.push(`  <wcs:format>${this.escapeXml(options.format)}</wcs:format>`);
        }

        // Subsetting
        if (options.subset && options.subset.length > 0) {
            options.subset.forEach(subset => {
                const subsetXml = this.buildSubsetXml(subset);
                parts.push(subsetXml);
            });
        }

        // Scaling
        if (options.scaling) {
            const scalingXml = this.buildScalingXml(options.scaling);
            parts.push(scalingXml);
        }

        // Range subsetting
        if (options.rangeSubset && options.rangeSubset.length > 0) {
            parts.push('  <wcs:Extension>');
            parts.push('    <rsub:RangeSubset>');
            options.rangeSubset.forEach(band => {
                parts.push(`      <rsub:RangeItem>`);
                parts.push(`        <rsub:RangeComponent>${this.escapeXml(band)}</rsub:RangeComponent>`);
                parts.push(`      </rsub:RangeItem>`);
            });
            parts.push('    </rsub:RangeSubset>');
            parts.push('  </wcs:Extension>');
        }

        parts.push('</wcs:GetCoverage>');

        return parts.join('\n');
    }

    // Helper methods

    private buildSubsetString(subset: WcsSubset): string {
        if (subset.value !== undefined) {
            // Point subsetting
            return `${subset.axis}(${subset.value})`;
        } else if (subset.min !== undefined && subset.max !== undefined) {
            // Trim subsetting
            return `${subset.axis}(${subset.min},${subset.max})`;
        } else if (subset.min !== undefined) {
            // Lower bound only
            return `${subset.axis}(${subset.min},*)`;
        } else if (subset.max !== undefined) {
            // Upper bound only
            return `${subset.axis}(*,${subset.max})`;
        }
        throw new Error('Invalid subset: must specify value OR min/max');
    }

    private buildSubsetXml(subset: WcsSubset): string {
        const parts = ['  <wcs:DimensionTrim>'];
        parts.push(`    <wcs:Dimension>${this.escapeXml(subset.axis)}</wcs:Dimension>`);

        if (subset.value !== undefined) {
            // Convert to TrimLow/TrimHigh with same value
            parts.push(`    <wcs:TrimLow>${subset.value}</wcs:TrimLow>`);
            parts.push(`    <wcs:TrimHigh>${subset.value}</wcs:TrimHigh>`);
        } else {
            if (subset.min !== undefined) {
                parts.push(`    <wcs:TrimLow>${subset.min}</wcs:TrimLow>`);
            }
            if (subset.max !== undefined) {
                parts.push(`    <wcs:TrimHigh>${subset.max}</wcs:TrimHigh>`);
            }
        }

        parts.push('  </wcs:DimensionTrim>');
        return parts.join('\n');
    }

    private buildScalingParameter(scaling: WcsScaling): { name: string; value: string } | null {
        switch (scaling.type) {
            case 'size':
                return {
                    name: 'scaleSize',
                    value: Array.isArray(scaling.value)
                        ? `axis1(${scaling.value[0]}),axis2(${scaling.value[1]})`
                        : String(scaling.value)
                };
            case 'extent':
                return {
                    name: 'scaleExtent',
                    value: Array.isArray(scaling.value)
                        ? `axis1(${scaling.value[0]},${scaling.value[1]}),axis2(${scaling.value[2]},${scaling.value[3]})`
                        : String(scaling.value)
                };
            case 'factor':
                return {
                    name: 'scaleFactor',
                    value: String(scaling.value)
                };
            default:
                return null;
        }
    }

    private buildScalingXml(scaling: WcsScaling): string {
        const parts = ['  <wcs:Extension>'];
        parts.push('    <scal:ScaleByFactor>');

        if (scaling.type === 'factor') {
            parts.push(`      <scal:scaleFactor>${scaling.value}</scal:scaleFactor>`);
        } else if (scaling.type === 'size') {
            parts.push('      <scal:ScaleToSize>');
            if (Array.isArray(scaling.value)) {
                parts.push(`        <scal:TargetAxisSize><scal:axis>axis1</scal:axis><scal:targetSize>${scaling.value[0]}</scal:targetSize></scal:TargetAxisSize>`);
                parts.push(`        <scal:TargetAxisSize><scal:axis>axis2</scal:axis><scal:targetSize>${scaling.value[1]}</scal:targetSize></scal:TargetAxisSize>`);
            } else {
                parts.push(`        <scal:targetSize>${scaling.value}</scal:targetSize>`);
            }
            parts.push('      </scal:ScaleToSize>');
        }

        parts.push('    </scal:ScaleByFactor>');
        parts.push('  </wcs:Extension>');
        return parts.join('\n');
    }

    private escapeXml(text: string): string {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

/**
 * Helper function to create WCS GetCoverage request URL
 */
export function buildWcsGetCoverageUrl(
    baseUrl: string,
    options: WcsGetCoverageOptions,
    version: WcsVersion = '2.0.1'
): string {
    const builder = new WcsRequestBuilder(baseUrl, version);
    return builder.buildGetCoverageUrl(options);
}

/**
 * Helper function to create WCS GetCoverage request XML
 */
export function buildWcsGetCoverageXml(
    options: WcsGetCoverageOptions,
    version: WcsVersion = '2.0.1'
): string {
    const builder = new WcsRequestBuilder('', version);
    return builder.buildGetCoverageXml(options);
}
