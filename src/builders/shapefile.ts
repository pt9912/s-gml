/**
 * Shapefile Builder
 *
 * Generates ESRI Shapefiles (.shp, .shx, .dbf, .prj) from GML data.
 * Uses @mapbox/shp-write to create ZIP archives containing all shapefile components.
 *
 * Note: Shapefiles have a 10-character limit for property field names.
 * Property names exceeding this limit will be automatically truncated.
 *
 * Usage:
 * ```typescript
 * const builder = new ShapefileBuilder();
 * const parser = new GmlParser(builder);
 * const featureCollection = await parser.parse(gmlXml);
 *
 * // Export as ZIP
 * const zipBlob = builder.toZip(featureCollection);
 *
 * // Export as ArrayBuffer
 * const buffer = builder.toZip(featureCollection, { outputType: 'arraybuffer' });
 * ```
 */

import * as shpWrite from '@mapbox/shp-write';
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

export interface ShapefileOptions {
    /**
     * Internal folder name in the ZIP
     * @default 'layers'
     */
    folder?: string;

    /**
     * Filename for the ZIP file (without extension)
     * @default 'shapefile'
     */
    filename?: string;

    /**
     * Output type: 'blob', 'base64', 'arraybuffer'
     * @default 'blob'
     */
    outputType?: 'blob' | 'base64' | 'arraybuffer';

    /**
     * Compression method: 'STORE' or 'DEFLATE'
     * @default 'DEFLATE'
     */
    compression?: 'STORE' | 'DEFLATE';

    /**
     * Custom layer names by geometry type
     */
    types?: {
        point?: string;
        polygon?: string;
        polyline?: string;
    };

    /**
     * Custom projection string in WKT format
     * If not specified, WGS84 will be used
     */
    prj?: string;

    /**
     * Truncate property names to 10 characters (Shapefile limitation)
     * @default true
     */
    truncateFieldNames?: boolean;
}

/**
 * Builder that generates GeoJSON and provides methods to export as Shapefile
 */
export class ShapefileBuilder implements Builder<Geometry, Feature, FeatureCollection> {
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
     * Convert GeoJSON FeatureCollection to Shapefile ZIP
     *
     * @param featureCollection GeoJSON FeatureCollection
     * @param options Shapefile export options
     * @returns Promise resolving to ZIP file (type depends on outputType option)
     */
    async toZip(
        featureCollection: FeatureCollection,
        options: ShapefileOptions = {}
    ): Promise<any> {
        const {
            folder = 'layers',
            filename = 'shapefile',
            outputType = 'blob',
            compression = 'DEFLATE',
            types,
            prj,
            truncateFieldNames = true,
        } = options;

        // Truncate field names if needed (Shapefile 10-character limit)
        let processedFeatureCollection = featureCollection;
        if (truncateFieldNames) {
            processedFeatureCollection = this.truncatePropertyNames(featureCollection);
        }

        // Generate ZIP using shp-write
        const zipOptions: any = {
            folder,
            filename,
            outputType,
            compression,
        };

        if (types) {
            zipOptions.types = types;
        }

        if (prj) {
            zipOptions.prj = prj;
        }

        return await shpWrite.zip(processedFeatureCollection, zipOptions);
    }

    /**
     * Truncate property names to 10 characters (Shapefile limitation)
     */
    private truncatePropertyNames(featureCollection: FeatureCollection): FeatureCollection {
        return {
            ...featureCollection,
            features: featureCollection.features.map((feature) => {
                if (!feature.properties) return feature;

                const truncatedProperties: Record<string, any> = {};
                for (const [key, value] of Object.entries(feature.properties)) {
                    // Truncate to 10 characters
                    const truncatedKey = key.substring(0, 10);
                    truncatedProperties[truncatedKey] = value;
                }

                return {
                    ...feature,
                    properties: truncatedProperties,
                };
            }),
        };
    }

    /**
     * Generate WGS84 WKT projection string
     * This is the default projection for most GML data
     */
    static getWgs84Prj(): string {
        return `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]`;
    }

    /**
     * Generate Web Mercator (EPSG:3857) WKT projection string
     * Common for web mapping applications
     */
    static getWebMercatorPrj(): string {
        return `PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Standard_Parallel_1",0],PARAMETER["Auxiliary_Sphere_Type",0],UNIT["Meter",1]]`;
    }
}

/**
 * Helper function to export GeoJSON FeatureCollection as Shapefile ZIP
 *
 * @param featureCollection GeoJSON FeatureCollection
 * @param options Shapefile export options
 * @returns Promise resolving to ZIP file (type depends on outputType option, default is Blob)
 */
export async function toShapefile(
    featureCollection: FeatureCollection,
    options: ShapefileOptions = {}
): Promise<any> {
    const builder = new ShapefileBuilder();
    return await builder.toZip(featureCollection, options);
}
