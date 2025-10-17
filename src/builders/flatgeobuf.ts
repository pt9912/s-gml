/**
 * FlatGeobuf Builder
 *
 * Converts GML geometries to FlatGeobuf format (.fgb).
 * FlatGeobuf is a performant binary encoding for geographic data based on flatbuffers.
 *
 * @see https://flatgeobuf.org/
 */

import { serialize } from 'flatgeobuf/lib/mjs/geojson.js';
import {
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
    Geometry,
    Feature,
    FeatureCollection
} from '../types.js';
import { GeoJsonBuilder } from './geojson.js';

/**
 * Builder that converts GML to GeoJSON and provides methods to export as FlatGeobuf
 */
export class FlatGeobufBuilder implements Builder<Geometry, Feature, FeatureCollection> {
    private geoJsonBuilder: GeoJsonBuilder;

    constructor() {
        this.geoJsonBuilder = new GeoJsonBuilder();
    }

    buildPoint(gml: GmlPoint): Geometry {
        return this.geoJsonBuilder.buildPoint(gml);
    }

    buildLineString(gml: GmlLineString): Geometry {
        return this.geoJsonBuilder.buildLineString(gml);
    }

    buildPolygon(gml: GmlPolygon): Geometry {
        return this.geoJsonBuilder.buildPolygon(gml);
    }

    buildMultiPoint(gml: GmlMultiPoint): Geometry {
        return this.geoJsonBuilder.buildMultiPoint(gml);
    }

    buildMultiLineString(gml: GmlMultiLineString): Geometry {
        return this.geoJsonBuilder.buildMultiLineString(gml);
    }

    buildMultiPolygon(gml: GmlMultiPolygon): Geometry {
        return this.geoJsonBuilder.buildMultiPolygon(gml);
    }

    buildLinearRing(gml: GmlLinearRing): Geometry {
        return this.geoJsonBuilder.buildLinearRing(gml);
    }

    buildEnvelope(gml: GmlEnvelope): Feature {
        return this.geoJsonBuilder.buildEnvelope(gml);
    }

    buildBox(gml: GmlBox): Feature {
        return this.geoJsonBuilder.buildBox(gml);
    }

    buildCurve(gml: GmlCurve): Geometry {
        return this.geoJsonBuilder.buildCurve(gml);
    }

    buildSurface(gml: GmlSurface): Geometry {
        return this.geoJsonBuilder.buildSurface(gml);
    }

    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): Feature {
        return this.geoJsonBuilder.buildRectifiedGridCoverage(gml);
    }

    buildGridCoverage(gml: GmlGridCoverage): Feature {
        return this.geoJsonBuilder.buildGridCoverage(gml);
    }

    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): Feature {
        return this.geoJsonBuilder.buildReferenceableGridCoverage(gml);
    }

    buildMultiPointCoverage(gml: GmlMultiPointCoverage): Feature {
        return this.geoJsonBuilder.buildMultiPointCoverage(gml);
    }

    buildFeature(gml: GmlFeature): Feature {
        return this.geoJsonBuilder.buildFeature(gml);
    }

    buildFeatureCollection(gml: GmlFeatureCollection): FeatureCollection {
        return this.geoJsonBuilder.buildFeatureCollection(gml);
    }

    /**
     * Convert GeoJSON FeatureCollection to FlatGeobuf binary format
     *
     * @param featureCollection GeoJSON FeatureCollection
     * @returns Uint8Array containing the FlatGeobuf binary data
     */
    toFlatGeobuf(featureCollection: FeatureCollection): Uint8Array {
        try {
            return serialize(featureCollection);
        } catch (error) {
            throw new Error(`Failed to serialize to FlatGeobuf: ${(error as Error).message}`);
        }
    }
}

/**
 * Helper function to export GeoJSON FeatureCollection as FlatGeobuf
 *
 * @param featureCollection GeoJSON FeatureCollection
 * @returns Uint8Array containing the FlatGeobuf binary data
 */
export function toFlatGeobuf(featureCollection: FeatureCollection): Uint8Array {
    const builder = new FlatGeobufBuilder();
    return builder.toFlatGeobuf(featureCollection);
}
