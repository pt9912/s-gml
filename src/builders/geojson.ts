import { Builder, GmlPoint, GmlLineString, GmlPolygon, GmlLinearRing, GmlEnvelope, GmlBox, GmlCurve, GmlSurface, GmlMultiPoint, GmlMultiLineString, GmlMultiPolygon, Geometry, Feature, FeatureCollection, GmlFeature, GmlFeatureCollection, GmlGeometry } from '../types.js';

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
        return {
            type: 'FeatureCollection',
            features: gml.features.map(feature => this.buildFeature(feature)),
        };
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
