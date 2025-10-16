import type {
    Builder,
    GmlPoint,
    GmlLineString,
    GmlPolygon,
    GmlLinearRing,
    GmlEnvelope,
    GmlBox,
    GmlCurve,
    GmlSurface,
    GmlMultiPoint,
    GmlMultiLineString,
    GmlMultiPolygon,
    GmlFeature,
    GmlFeatureCollection,
    GmlRectifiedGridCoverage,
    GmlGridCoverage,
    GmlReferenceableGridCoverage,
    GmlMultiPointCoverage,
} from '../types.js';

/**
 * CoverageJSON Builder - Outputs OGC CoverageJSON format
 *
 * This builder creates JSON output following the OGC CoverageJSON Community Standard,
 * which is optimized for web consumption and differs from CIS JSON.
 *
 * Reference: https://docs.ogc.org/cs/21-069r2/21-069r2.html
 */
export class CoverageJsonBuilder implements Builder<any, any, any> {
    // For simple geometries, fallback to GeoJSON-like output
    buildPoint(gml: GmlPoint): any {
        return {
            type: 'Point',
            coordinates: gml.coordinates,
        };
    }

    buildLineString(gml: GmlLineString): any {
        return {
            type: 'LineString',
            coordinates: gml.coordinates,
        };
    }

    buildPolygon(gml: GmlPolygon): any {
        return {
            type: 'Polygon',
            coordinates: gml.coordinates,
        };
    }

    buildMultiPoint(gml: GmlMultiPoint): any {
        return {
            type: 'MultiPoint',
            coordinates: gml.coordinates,
        };
    }

    buildMultiLineString(gml: GmlMultiLineString): any {
        return {
            type: 'MultiLineString',
            coordinates: gml.coordinates,
        };
    }

    buildMultiPolygon(gml: GmlMultiPolygon): any {
        return {
            type: 'MultiPolygon',
            coordinates: gml.coordinates,
        };
    }

    buildLinearRing(gml: GmlLinearRing): any {
        return {
            type: 'LineString',
            coordinates: gml.coordinates,
        };
    }

    buildEnvelope(gml: GmlEnvelope): any {
        return {
            type: 'Polygon',
            coordinates: [[
                [gml.bbox[0], gml.bbox[1]],
                [gml.bbox[2], gml.bbox[1]],
                [gml.bbox[2], gml.bbox[3]],
                [gml.bbox[0], gml.bbox[3]],
                [gml.bbox[0], gml.bbox[1]],
            ]],
        };
    }

    buildBox(gml: GmlBox): any {
        return this.buildEnvelope({
            type: 'Envelope',
            bbox: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    buildCurve(gml: GmlCurve): any {
        return {
            type: 'LineString',
            coordinates: gml.coordinates,
        };
    }

    buildSurface(gml: GmlSurface): any {
        return {
            type: 'MultiPolygon',
            coordinates: gml.patches.map(patch => patch.coordinates),
        };
    }

    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): any {
        const coverage: any = {
            type: 'Coverage',
            domain: this.buildGridDomain(gml),
            parameters: this.buildParameters(gml),
            ranges: this.buildRanges(gml),
        };

        // Add referencing (CRS info)
        if (gml.domainSet.srsName) {
            coverage.domain.referencing = [{
                coordinates: gml.domainSet.axisLabels || ['x', 'y'],
                system: {
                    type: 'GeographicCRS',
                    id: gml.domainSet.srsName,
                }
            }];
        }

        return coverage;
    }

    buildGridCoverage(gml: GmlGridCoverage): any {
        return {
            type: 'Coverage',
            domain: {
                type: 'Domain',
                domainType: 'Grid',
                axes: this.buildSimpleGridAxes(gml),
            },
            parameters: this.buildParameters(gml),
            ranges: this.buildRanges(gml),
        };
    }

    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): any {
        // Similar to GridCoverage
        return this.buildGridCoverage({
            ...gml,
            type: 'GridCoverage',
        });
    }

    buildMultiPointCoverage(gml: GmlMultiPointCoverage): any {
        const coverage: any = {
            type: 'Coverage',
            domain: {
                type: 'Domain',
                domainType: 'PointSeries',
                axes: {
                    composite: {
                        dataType: 'tuple',
                        coordinates: ['x', 'y'],
                        values: gml.domainSet.coordinates,
                    },
                },
            },
            parameters: {},
            ranges: {},
        };

        // Add referencing (CRS info)
        if (gml.domainSet.srsName) {
            coverage.domain.referencing = [{
                coordinates: ['x', 'y'],
                system: {
                    type: 'GeographicCRS',
                    id: gml.domainSet.srsName,
                }
            }];
        }

        // Build parameters
        if (gml.rangeType && gml.rangeType.field) {
            gml.rangeType.field.forEach(field => {
                coverage.parameters[field.name] = {
                    type: 'Parameter',
                    description: field.description ? { en: field.description } : undefined,
                    unit: field.uom ? { symbol: field.uom } : undefined,
                    observedProperty: {
                        label: { en: field.name },
                    },
                };
            });
        } else {
            coverage.parameters.value = {
                type: 'Parameter',
                observedProperty: {
                    label: { en: 'Value' },
                },
            };
        }

        // Build ranges
        if (gml.rangeSet.file) {
            const paramNames = Object.keys(coverage.parameters);
            paramNames.forEach(name => {
                coverage.ranges[name] = {
                    type: 'NdArray',
                    dataType: 'float',
                    axisNames: ['composite'],
                    shape: [gml.domainSet.coordinates.length],
                    values: [], // Reference to external file
                };
            });
        } else {
            const paramNames = Object.keys(coverage.parameters);
            paramNames.forEach(name => {
                coverage.ranges[name] = {
                    type: 'NdArray',
                    dataType: 'float',
                    axisNames: ['composite'],
                    shape: [gml.domainSet.coordinates.length],
                    values: [], // Would be populated with actual data
                };
            });
        }

        return coverage;
    }

    buildFeature(gml: GmlFeature): any {
        return {
            type: 'Feature',
            id: gml.id,
            geometry: this.buildGeometry(gml.geometry),
            properties: gml.properties,
        };
    }

    buildFeatureCollection(gml: GmlFeatureCollection): any {
        return {
            type: 'FeatureCollection',
            features: gml.features.map(f => this.buildFeature(f)),
        };
    }

    private buildGridDomain(gml: GmlRectifiedGridCoverage): any {
        const domain: any = {
            type: 'Domain',
            domainType: 'Grid',
            axes: {},
        };

        const labels = gml.domainSet.axisLabels || ['x', 'y'];
        const numAxes = gml.domainSet.dimension;

        // Build axes based on offsetVectors
        for (let i = 0; i < numAxes; i++) {
            const label = labels[i];
            const low = gml.domainSet.limits.low[i];
            const high = gml.domainSet.limits.high[i];
            const origin = gml.domainSet.origin[i];
            const offset = gml.domainSet.offsetVectors[i]?.[i] || 1;

            domain.axes[label] = {
                start: origin,
                stop: origin + (high - low) * offset,
                num: high - low + 1,
            };
        }

        return domain;
    }

    private buildSimpleGridAxes(gml: GmlGridCoverage): any {
        const axes: any = {};
        const labels = gml.domainSet.axisLabels || ['x', 'y'];
        const numAxes = gml.domainSet.dimension;

        for (let i = 0; i < numAxes; i++) {
            const label = labels[i];
            const low = gml.domainSet.limits.low[i];
            const high = gml.domainSet.limits.high[i];

            axes[label] = {
                start: low,
                stop: high,
                num: high - low + 1,
            };
        }

        return axes;
    }

    private buildParameters(gml: GmlRectifiedGridCoverage | GmlGridCoverage | GmlReferenceableGridCoverage | GmlMultiPointCoverage): any {
        const parameters: any = {};

        if (gml.rangeType && gml.rangeType.field) {
            gml.rangeType.field.forEach(field => {
                parameters[field.name] = {
                    type: 'Parameter',
                    description: field.description ? { en: field.description } : undefined,
                    unit: field.uom ? { symbol: field.uom } : undefined,
                    observedProperty: {
                        label: { en: field.name },
                    },
                };
            });
        } else {
            // Default parameter if none specified
            parameters.value = {
                type: 'Parameter',
                observedProperty: {
                    label: { en: 'Value' },
                },
            };
        }

        return parameters;
    }

    private buildRanges(gml: GmlRectifiedGridCoverage | GmlGridCoverage | GmlReferenceableGridCoverage | GmlMultiPointCoverage): any {
        const ranges: any = {};

        // Handle MultiPointCoverage differently (no grid limits)
        if (gml.type === 'MultiPointCoverage') {
            const paramNames = Object.keys(this.buildParameters(gml));
            paramNames.forEach(name => {
                ranges[name] = {
                    type: 'NdArray',
                    dataType: 'float',
                    axisNames: ['composite'],
                    shape: [gml.domainSet.coordinates.length],
                    values: [],
                };
            });
            return ranges;
        }

        // Handle Grid-based coverages
        if (gml.rangeSet.file) {
            // Reference to external file
            if (gml.rangeType && gml.rangeType.field) {
                gml.rangeType.field.forEach(field => {
                    ranges[field.name] = {
                        type: 'TiledNdArray',
                        dataType: field.dataType || 'float',
                        axisNames: ('axisLabels' in gml.domainSet && gml.domainSet.axisLabels)
                            ? gml.domainSet.axisLabels
                            : ['x', 'y'],
                        shape: [
                            gml.domainSet.limits.high[0] - gml.domainSet.limits.low[0] + 1,
                            gml.domainSet.limits.high[1] - gml.domainSet.limits.low[1] + 1,
                        ],
                        tileSets: [{
                            tileShape: null,
                            urlTemplate: gml.rangeSet.file?.fileName || '',
                        }],
                    };
                });
            } else {
                ranges.value = {
                    type: 'TiledNdArray',
                    dataType: 'float',
                    axisNames: ('axisLabels' in gml.domainSet && gml.domainSet.axisLabels)
                        ? gml.domainSet.axisLabels
                        : ['x', 'y'],
                    urlTemplate: gml.rangeSet.file?.fileName || '',
                };
            }
        } else {
            // Inline data (empty for now)
            const paramNames = Object.keys(this.buildParameters(gml));
            paramNames.forEach(name => {
                ranges[name] = {
                    type: 'NdArray',
                    dataType: 'float',
                    axisNames: gml.domainSet.axisLabels || ['x', 'y'],
                    shape: [
                        gml.domainSet.limits.high[0] - gml.domainSet.limits.low[0] + 1,
                        gml.domainSet.limits.high[1] - gml.domainSet.limits.low[1] + 1,
                    ],
                    values: [], // Would be populated with actual data
                };
            });
        }

        return ranges;
    }

    private buildGeometry(gml: any): any {
        switch (gml.type) {
            case 'Point': return this.buildPoint(gml);
            case 'LineString': return this.buildLineString(gml);
            case 'Polygon': return this.buildPolygon(gml);
            case 'LinearRing': return this.buildLinearRing(gml);
            case 'Envelope': return this.buildEnvelope(gml);
            case 'Box': return this.buildBox(gml);
            case 'Curve': return this.buildCurve(gml);
            case 'Surface': return this.buildSurface(gml);
            case 'MultiPoint': return this.buildMultiPoint(gml);
            case 'MultiLineString': return this.buildMultiLineString(gml);
            case 'MultiPolygon': return this.buildMultiPolygon(gml);
            default:
                throw new Error(`Unsupported geometry type: ${gml.type}`);
        }
    }
}
