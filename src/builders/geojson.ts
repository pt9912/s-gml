import { Builder, GmlPoint, GmlLineString, GmlPolygon, GmlLinearRing, GmlEnvelope, GmlBox, GmlCurve, GmlSurface, GmlMultiPoint, GmlMultiLineString, GmlMultiPolygon, Geometry, Feature } from '../types.js';

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

}
