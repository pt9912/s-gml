import { Builder, GmlPoint, GmlLineString, GmlPolygon, GmlLinearRing, GmlEnvelope, GmlBox, GmlCurve, GmlSurface, GmlMultiPoint, GmlMultiLineString, GmlMultiPolygon, Geometry, Feature, FeatureCollection, GmlFeature, GmlFeatureCollection, GmlGeometry, GmlRectifiedGridCoverage, GmlGridCoverage, GmlReferenceableGridCoverage, GmlMultiPointCoverage } from '../types.js';

export class GeoJsonBuilder implements Builder {
    buildPoint(gml: GmlPoint): Geometry {
        return { type: 'Point', coordinates: gml.coordinates };
    }

    buildLineString(gml: GmlLineString): Geometry {
        return { type: 'LineString', coordinates: gml.coordinates };
    }

    buildPolygon(gml: GmlPolygon): Geometry {
        return { type: 'Polygon', coordinates: gml.coordinates };
    }

    buildMultiPoint(gml: GmlMultiPoint): Geometry {
        return { type: 'MultiPoint', coordinates: gml.coordinates };
    }

    buildMultiLineString(gml: GmlMultiLineString): Geometry {
        return { type: 'MultiLineString', coordinates: gml.coordinates };
    }

    buildMultiPolygon(gml: GmlMultiPolygon): Geometry {
        return { type: 'MultiPolygon', coordinates: gml.coordinates };
    }


    buildLinearRing(gml: GmlLinearRing): Geometry {
        return {
            type: 'LineString',
            coordinates: gml.coordinates,
        };
    }

    buildEnvelope(gml: GmlEnvelope): Feature {
        return {
            type: 'Feature',
            bbox: gml.bbox,
            properties: { type: 'Envelope' },
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [gml.bbox[0], gml.bbox[1]],
                        [gml.bbox[2], gml.bbox[1]],
                        [gml.bbox[2], gml.bbox[3]],
                        [gml.bbox[0], gml.bbox[3]],
                        [gml.bbox[0], gml.bbox[1]],
                    ],
                ],
            },
        };
    }

    buildBox(gml: GmlBox): Feature {
        return this.buildEnvelope({
            type: 'Envelope',
            bbox: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    buildCurve(gml: GmlCurve): Geometry {
        return {
            type: 'LineString',
            coordinates: gml.coordinates,
        };
    }

    buildSurface(gml: GmlSurface): Geometry {
        return {
            type: 'MultiPolygon',
            coordinates: gml.patches.map(patch => patch.coordinates),
        };
    }

    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): Feature {
        // Create geometry from boundedBy if available
        let geometry: Geometry | null = null;
        let bbox: number[] | undefined;

        if (gml.boundedBy) {
            bbox = gml.boundedBy.bbox;
            geometry = {
                type: 'Polygon',
                coordinates: [
                    [
                        [bbox[0], bbox[1]],
                        [bbox[2], bbox[1]],
                        [bbox[2], bbox[3]],
                        [bbox[0], bbox[3]],
                        [bbox[0], bbox[1]],
                    ],
                ],
            };
        }

        // Build properties with all Coverage metadata
        const properties: any = {
            coverageType: 'RectifiedGridCoverage',
            grid: {
                dimension: gml.domainSet.dimension,
                srsName: gml.domainSet.srsName,
                limits: gml.domainSet.limits,
                axisLabels: gml.domainSet.axisLabels,
                origin: gml.domainSet.origin,
                offsetVectors: gml.domainSet.offsetVectors,
            },
        };

        if (gml.rangeType) {
            properties.rangeType = gml.rangeType;
        }

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file;
        }

        const feature: Feature = {
            type: 'Feature',
            geometry: geometry || { type: 'Point', coordinates: gml.domainSet.origin },
            properties,
        };

        if (gml.id) {
            feature.id = gml.id;
        }

        if (bbox && bbox.length === 4) {
            feature.bbox = bbox as [number, number, number, number];
        }

        return feature;
    }

    buildGridCoverage(gml: GmlGridCoverage): Feature {
        // Create geometry from boundedBy if available
        let geometry: Geometry | null = null;
        let bbox: number[] | undefined;

        if (gml.boundedBy) {
            bbox = gml.boundedBy.bbox;
            geometry = {
                type: 'Polygon',
                coordinates: [
                    [
                        [bbox[0], bbox[1]],
                        [bbox[2], bbox[1]],
                        [bbox[2], bbox[3]],
                        [bbox[0], bbox[3]],
                        [bbox[0], bbox[1]],
                    ],
                ],
            };
        }

        // Build properties with all Coverage metadata
        const properties: any = {
            coverageType: 'GridCoverage',
            grid: {
                dimension: gml.domainSet.dimension,
                limits: gml.domainSet.limits,
                axisLabels: gml.domainSet.axisLabels,
            },
        };

        if (gml.rangeType) {
            properties.rangeType = gml.rangeType;
        }

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file;
        }

        const feature: Feature = {
            type: 'Feature',
            geometry: geometry || { type: 'Point', coordinates: [0, 0] },
            properties,
        };

        if (gml.id) {
            feature.id = gml.id;
        }

        if (bbox && bbox.length === 4) {
            feature.bbox = bbox as [number, number, number, number];
        }

        return feature;
    }

    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): Feature {
        // Create geometry from boundedBy if available
        let geometry: Geometry | null = null;
        let bbox: number[] | undefined;

        if (gml.boundedBy) {
            bbox = gml.boundedBy.bbox;
            geometry = {
                type: 'Polygon',
                coordinates: [
                    [
                        [bbox[0], bbox[1]],
                        [bbox[2], bbox[1]],
                        [bbox[2], bbox[3]],
                        [bbox[0], bbox[3]],
                        [bbox[0], bbox[1]],
                    ],
                ],
            };
        }

        // Build properties with all Coverage metadata
        const properties: any = {
            coverageType: 'ReferenceableGridCoverage',
            grid: {
                dimension: gml.domainSet.dimension,
                limits: gml.domainSet.limits,
                axisLabels: gml.domainSet.axisLabels,
            },
        };

        if (gml.rangeType) {
            properties.rangeType = gml.rangeType;
        }

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file;
        }

        const feature: Feature = {
            type: 'Feature',
            geometry: geometry || { type: 'Point', coordinates: [0, 0] },
            properties,
        };

        if (gml.id) {
            feature.id = gml.id;
        }

        if (bbox && bbox.length === 4) {
            feature.bbox = bbox as [number, number, number, number];
        }

        return feature;
    }

    buildMultiPointCoverage(gml: GmlMultiPointCoverage): Feature {
        // Use MultiPoint as geometry
        const geometry: Geometry = this.buildMultiPoint(gml.domainSet);
        let bbox: number[] | undefined;

        if (gml.boundedBy) {
            bbox = gml.boundedBy.bbox;
        }

        // Build properties with Coverage metadata
        const properties: any = {
            coverageType: 'MultiPointCoverage',
            points: {
                count: gml.domainSet.coordinates.length,
                srsName: gml.domainSet.srsName,
            },
        };

        if (gml.rangeType) {
            properties.rangeType = gml.rangeType;
        }

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file;
        }

        const feature: Feature = {
            type: 'Feature',
            geometry,
            properties,
        };

        if (gml.id) {
            feature.id = gml.id;
        }

        if (bbox && bbox.length === 4) {
            feature.bbox = bbox as [number, number, number, number];
        }

        return feature;
    }

    buildFeature(gml: GmlFeature): Feature {
        const geometryResult = this.buildGeometry(gml.geometry);

        let geometry: Geometry;
        let properties = { ...gml.properties };

        if ((geometryResult as Feature).type === 'Feature') {
            const featureGeometry = geometryResult as Feature;
            geometry = featureGeometry.geometry as Geometry;
            properties = { ...featureGeometry.properties, ...properties };
        } else {
            geometry = geometryResult as Geometry;
        }

        const feature: Feature = {
            type: 'Feature',
            geometry,
            properties,
        };

        if (gml.id) {
            feature.id = gml.id;
        }

        if (gml.boundedBy) {
            feature.bbox = gml.boundedBy.bbox;
        }

        return feature;
    }

    buildFeatureCollection(gml: GmlFeatureCollection): FeatureCollection {
        const featureCollection: FeatureCollection = {
            type: 'FeatureCollection',
            features: gml.features.map(feature => this.buildFeature(feature)),
        };

        if (gml.bounds) {
            featureCollection.bbox = gml.bounds.bbox;
        }

        return featureCollection;
    }

    private buildGeometry(gml: GmlGeometry): Geometry | Feature {
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
                throw new Error(`Unsupported geometry type: ${(gml as any).type}`);
        }
    }
}
