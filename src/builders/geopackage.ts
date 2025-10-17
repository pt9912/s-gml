/**
 * GeoPackage Builder
 *
 * Generates OGC GeoPackage (.gpkg) files from GML data.
 * Uses @ngageoint/geopackage to create GeoPackage files from GeoJSON.
 *
 * GeoPackage is an open, standards-based, platform-independent, portable, self-describing,
 * compact format for transferring geospatial information.
 *
 * @see https://www.geopackage.org/
 */

import { GeoPackageAPI } from '@ngageoint/geopackage';
import { GeoJsonBuilder } from './geojson.js';
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
    GmlRectifiedGridCoverage,
    GmlGridCoverage,
    GmlReferenceableGridCoverage,
    GmlMultiPointCoverage,
    GmlFeature,
    GmlFeatureCollection,
    Geometry,
    Feature,
    FeatureCollection,
} from '../types.js';

export interface GeoPackageOptions {
    /**
     * Table name for the features
     * @default 'features'
     */
    tableName?: string;

    /**
     * SRID (Spatial Reference ID)
     * @default 4326 (WGS84)
     */
    srid?: number;
}

/**
 * Builder that generates GeoJSON and provides methods to export as GeoPackage
 */
export class GeoPackageBuilder implements Builder<Geometry, Feature, FeatureCollection> {
    private geojsonBuilder: GeoJsonBuilder;

    constructor() {
        this.geojsonBuilder = new GeoJsonBuilder();
    }

    buildPoint(gml: GmlPoint): Geometry {
        return this.geojsonBuilder.buildPoint(gml);
    }

    buildLineString(gml: GmlLineString): Geometry {
        return this.geojsonBuilder.buildLineString(gml);
    }

    buildPolygon(gml: GmlPolygon): Geometry {
        return this.geojsonBuilder.buildPolygon(gml);
    }

    buildMultiPoint(gml: GmlMultiPoint): Geometry {
        return this.geojsonBuilder.buildMultiPoint(gml);
    }

    buildMultiLineString(gml: GmlMultiLineString): Geometry {
        return this.geojsonBuilder.buildMultiLineString(gml);
    }

    buildMultiPolygon(gml: GmlMultiPolygon): Geometry {
        return this.geojsonBuilder.buildMultiPolygon(gml);
    }

    buildLinearRing(gml: GmlLinearRing): Geometry {
        return this.geojsonBuilder.buildLinearRing(gml);
    }

    buildEnvelope(gml: GmlEnvelope): Feature {
        return this.geojsonBuilder.buildEnvelope(gml);
    }

    buildBox(gml: GmlBox): Feature {
        return this.geojsonBuilder.buildBox(gml);
    }

    buildCurve(gml: GmlCurve): Geometry {
        return this.geojsonBuilder.buildCurve(gml);
    }

    buildSurface(gml: GmlSurface): Geometry {
        return this.geojsonBuilder.buildSurface(gml);
    }

    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): Feature {
        return this.geojsonBuilder.buildRectifiedGridCoverage(gml);
    }

    buildGridCoverage(gml: GmlGridCoverage): Feature {
        return this.geojsonBuilder.buildGridCoverage(gml);
    }

    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): Feature {
        return this.geojsonBuilder.buildReferenceableGridCoverage(gml);
    }

    buildMultiPointCoverage(gml: GmlMultiPointCoverage): Feature {
        return this.geojsonBuilder.buildMultiPointCoverage(gml);
    }

    buildFeature(gml: GmlFeature): Feature {
        return this.geojsonBuilder.buildFeature(gml);
    }

    buildFeatureCollection(gml: GmlFeatureCollection): FeatureCollection {
        return this.geojsonBuilder.buildFeatureCollection(gml);
    }

    /**
     * Convert GeoJSON FeatureCollection to GeoPackage binary data
     *
     * @param featureCollection GeoJSON FeatureCollection
     * @param options GeoPackage export options
     * @returns Promise resolving to Buffer containing the GeoPackage file
     */
    async toGeoPackage(
        featureCollection: FeatureCollection,
        options: GeoPackageOptions = {}
    ): Promise<Buffer> {
        const {
            tableName = 'features',
        } = options;

        try {
            // Create an in-memory GeoPackage
            const geoPackage = await GeoPackageAPI.create();

            // Add GeoJSON features to the GeoPackage
            await geoPackage.addGeoJSONFeaturesToGeoPackage(
                featureCollection.features,
                tableName,
                true // indexFeatures
            );

            // Export the GeoPackage as binary data
            const buffer = await geoPackage.export();

            return Buffer.from(buffer);
        } catch (error) {
            throw new Error(`Failed to create GeoPackage: ${(error as Error).message}`);
        }
    }
}

/**
 * Helper function to export GeoJSON FeatureCollection as GeoPackage
 *
 * @param featureCollection GeoJSON FeatureCollection
 * @param options GeoPackage export options
 * @returns Promise resolving to Buffer containing the GeoPackage file
 */
export async function toGeoPackage(
    featureCollection: FeatureCollection,
    options: GeoPackageOptions = {}
): Promise<Buffer> {
    const builder = new GeoPackageBuilder();
    return await builder.toGeoPackage(featureCollection, options);
}
