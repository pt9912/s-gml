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
 * CIS JSON Builder - Outputs OGC Coverage Implementation Schema JSON format
 *
 * This builder creates JSON output following the OGC CIS 1.1 json-coverage conformance class,
 * which is a near-literal translation of GML structures into JSON.
 */
export class CisJsonBuilder implements Builder<any, any, any> {
    buildPoint(gml: GmlPoint): any {
        return {
            type: 'Point',
            pos: gml.coordinates,
            srsName: gml.srsName,
        };
    }

    buildLineString(gml: GmlLineString): any {
        return {
            type: 'LineString',
            posList: gml.coordinates.flat(),
            srsName: gml.srsName,
        };
    }

    buildPolygon(gml: GmlPolygon): any {
        return {
            type: 'Polygon',
            exterior: gml.coordinates[0],
            interior: gml.coordinates.slice(1),
            srsName: gml.srsName,
        };
    }

    buildMultiPoint(gml: GmlMultiPoint): any {
        return {
            type: 'MultiPoint',
            pointMember: gml.coordinates.map(coords => ({
                Point: { pos: coords }
            })),
            srsName: gml.srsName,
        };
    }

    buildMultiLineString(gml: GmlMultiLineString): any {
        return {
            type: 'MultiLineString',
            lineStringMember: gml.coordinates.map(coords => ({
                LineString: { posList: coords.flat() }
            })),
            srsName: gml.srsName,
        };
    }

    buildMultiPolygon(gml: GmlMultiPolygon): any {
        return {
            type: 'MultiPolygon',
            polygonMember: gml.coordinates.map(coords => ({
                Polygon: {
                    exterior: coords[0],
                    interior: coords.slice(1),
                }
            })),
            srsName: gml.srsName,
        };
    }

    buildLinearRing(gml: GmlLinearRing): any {
        return {
            type: 'LinearRing',
            posList: gml.coordinates.flat(),
            srsName: gml.srsName,
        };
    }

    buildEnvelope(gml: GmlEnvelope): any {
        return {
            type: 'Envelope',
            lowerCorner: [gml.bbox[0], gml.bbox[1]],
            upperCorner: [gml.bbox[2], gml.bbox[3]],
            srsName: gml.srsName,
        };
    }

    buildBox(gml: GmlBox): any {
        return {
            type: 'Box',
            coordinates: gml.coordinates,
            srsName: gml.srsName,
        };
    }

    buildCurve(gml: GmlCurve): any {
        return {
            type: 'Curve',
            segments: {
                LineStringSegment: {
                    posList: gml.coordinates.flat()
                }
            },
            srsName: gml.srsName,
        };
    }

    buildSurface(gml: GmlSurface): any {
        return {
            type: 'Surface',
            patches: gml.patches.map(patch => ({
                PolygonPatch: {
                    exterior: patch.coordinates[0],
                    interior: patch.coordinates.slice(1),
                }
            })),
            srsName: gml.srsName,
        };
    }

    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): any {
        const coverage: any = {
            '@context': 'http://www.opengis.net/cis/1.1/json',
            type: 'CoverageByDomainAndRangeType',
            id: gml.id,
        };

        // Add boundedBy
        if (gml.boundedBy) {
            coverage.boundedBy = {
                Envelope: this.buildEnvelope(gml.boundedBy)
            };
        }

        // Build domainSet
        coverage.domainSet = {
            type: 'GeneralGrid',
            id: gml.domainSet.id,
            srsName: gml.domainSet.srsName,
            axisLabels: gml.domainSet.axisLabels || ['x', 'y'],
            axis: this.buildRectifiedGridAxes(gml),
        };

        // Build rangeType
        if (gml.rangeType && gml.rangeType.field) {
            coverage.rangeType = {
                type: 'DataRecord',
                field: gml.rangeType.field.map(f => ({
                    name: f.name,
                    definition: f.description,
                    uom: f.uom ? { code: f.uom } : undefined,
                    dataType: f.dataType,
                }))
            };
        }

        // Build rangeSet
        if (gml.rangeSet.file) {
            coverage.rangeSet = {
                type: 'DataBlock',
                dataReference: {
                    type: 'FileReference',
                    fileURL: gml.rangeSet.file.fileName,
                    fileStructure: gml.rangeSet.file.fileStructure,
                }
            };
        }

        return coverage;
    }

    buildGridCoverage(gml: GmlGridCoverage): any {
        const coverage: any = {
            '@context': 'http://www.opengis.net/cis/1.1/json',
            type: 'CoverageByDomainAndRangeType',
            id: gml.id,
        };

        if (gml.boundedBy) {
            coverage.boundedBy = {
                Envelope: this.buildEnvelope(gml.boundedBy)
            };
        }

        coverage.domainSet = {
            type: 'Grid',
            id: gml.domainSet.id,
            axisLabels: gml.domainSet.axisLabels || ['x', 'y'],
            limits: {
                GridEnvelope: {
                    low: gml.domainSet.limits.low,
                    high: gml.domainSet.limits.high,
                }
            }
        };

        if (gml.rangeType && gml.rangeType.field) {
            coverage.rangeType = {
                type: 'DataRecord',
                field: gml.rangeType.field.map(f => ({
                    name: f.name,
                    definition: f.description,
                    uom: f.uom ? { code: f.uom } : undefined,
                    dataType: f.dataType,
                }))
            };
        }

        if (gml.rangeSet.file) {
            coverage.rangeSet = {
                type: 'DataBlock',
                dataReference: {
                    type: 'FileReference',
                    fileURL: gml.rangeSet.file.fileName,
                    fileStructure: gml.rangeSet.file.fileStructure,
                }
            };
        }

        return coverage;
    }

    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): any {
        // Similar to GridCoverage with additional georeferencing
        return this.buildGridCoverage({
            ...gml,
            type: 'GridCoverage',
        });
    }

    buildMultiPointCoverage(gml: GmlMultiPointCoverage): any {
        const coverage: any = {
            '@context': 'http://www.opengis.net/cis/1.1/json',
            type: 'CoverageByDomainAndRangeType',
            id: gml.id,
        };

        // Add boundedBy
        if (gml.boundedBy) {
            coverage.boundedBy = {
                Envelope: this.buildEnvelope(gml.boundedBy)
            };
        }

        // Build domainSet with MultiPoint
        coverage.domainSet = this.buildMultiPoint(gml.domainSet);

        // Build rangeType
        if (gml.rangeType && gml.rangeType.field) {
            coverage.rangeType = {
                type: 'DataRecord',
                field: gml.rangeType.field.map(f => ({
                    name: f.name,
                    definition: f.description,
                    uom: f.uom ? { code: f.uom } : undefined,
                    dataType: f.dataType,
                }))
            };
        }

        // Build rangeSet
        if (gml.rangeSet.file) {
            coverage.rangeSet = {
                type: 'DataBlock',
                dataReference: {
                    type: 'FileReference',
                    fileURL: gml.rangeSet.file.fileName,
                    fileStructure: gml.rangeSet.file.fileStructure,
                }
            };
        }

        return coverage;
    }

    buildFeature(gml: GmlFeature): any {
        return {
            type: 'Feature',
            id: gml.id,
            geometry: this.buildGeometry(gml.geometry),
            properties: gml.properties,
            boundedBy: gml.boundedBy ? this.buildEnvelope(gml.boundedBy) : undefined,
        };
    }

    buildFeatureCollection(gml: GmlFeatureCollection): any {
        return {
            type: 'FeatureCollection',
            features: gml.features.map(f => this.buildFeature(f)),
            boundedBy: gml.bounds ? this.buildEnvelope(gml.bounds) : undefined,
        };
    }

    private buildRectifiedGridAxes(gml: GmlRectifiedGridCoverage): any[] {
        const axes = [];
        const numAxes = gml.domainSet.dimension;
        const labels = gml.domainSet.axisLabels || [];

        for (let i = 0; i < numAxes; i++) {
            axes.push({
                type: 'RegularAxis',
                axisLabel: labels[i] || `axis${i}`,
                lowerBound: gml.domainSet.limits.low[i],
                upperBound: gml.domainSet.limits.high[i],
                uomLabel: 'GridSpacing',
                resolution: Math.abs(
                    gml.domainSet.offsetVectors[i]?.[i] || 1
                ),
            });
        }

        return axes;
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
