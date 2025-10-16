/**
 * Type definitions for @mapbox/shp-write
 * Writes shapefiles in pure JavaScript
 */

declare module '@mapbox/shp-write' {
    import { FeatureCollection } from 'geojson';

    export interface ShpWriteOptions {
        /**
         * Internal folder name in the ZIP
         * @default 'layers'
         */
        folder?: string;

        /**
         * Filename for the ZIP file (without extension)
         * @default 'download'
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
         * @default WGS84
         */
        prj?: string;
    }

    export interface ShpWriteResult {
        shp: DataView;
        shx: DataView;
        dbf: DataView;
    }

    /**
     * Generate a ZIP file containing shapefile components from GeoJSON
     * @param geojson GeoJSON FeatureCollection
     * @param options Optional configuration
     * @returns Promise resolving to ZIP data in the specified outputType format
     */
    export function zip(
        geojson: FeatureCollection,
        options?: ShpWriteOptions
    ): Promise<any>;

    /**
     * Low-level API to write shapefile components
     * @param data Array of property objects
     * @param geometryType OGC geometry type (e.g., 'POINT', 'POLYGON')
     * @param geometries Array of coordinate arrays
     * @param callback Callback with error and result
     */
    export function write(
        data: Record<string, any>[],
        geometryType: string,
        geometries: number[][][],
        callback: (err: Error | null, result: ShpWriteResult | null) => void
    ): void;

    /**
     * @deprecated Use external libraries like file-saver instead
     * Triggers browser download of zipped shapefile
     * @param geojson GeoJSON FeatureCollection
     * @param options Optional configuration
     */
    export function download(
        geojson: FeatureCollection,
        options?: ShpWriteOptions
    ): void;
}
