import type { GmlCoverage } from '../types.js';

/**
 * GeoTIFF metadata extracted from GML Coverage
 */
export interface GeoTiffMetadata {
    /** Image width in pixels */
    width: number;
    /** Image height in pixels */
    height: number;
    /** Geographic bounds [minX, minY, maxX, maxY] */
    bbox?: [number, number, number, number];
    /** Coordinate Reference System (EPSG code or WKT) */
    crs?: string;
    /** Affine transformation matrix [a, b, c, d, e, f] */
    transform?: number[];
    /** Pixel resolution [xRes, yRes] */
    resolution?: [number, number];
    /** Origin point in world coordinates */
    origin?: number[];
    /** Rotation angle in degrees (if applicable) */
    rotation?: number;
    /** Number of bands/channels */
    bands?: number;
    /** Band metadata */
    bandInfo?: Array<{
        name?: string;
        dataType?: string;
        uom?: string;
        description?: string;
    }>;
}

/**
 * Extract GeoTIFF-compatible metadata from GML Coverage
 * Note: Only works with Grid-based coverages (RectifiedGridCoverage, GridCoverage, ReferenceableGridCoverage)
 */
export function extractGeoTiffMetadata(coverage: GmlCoverage): GeoTiffMetadata {
    // MultiPointCoverage is not supported for GeoTIFF metadata
    if (coverage.type === 'MultiPointCoverage') {
        throw new Error('GeoTIFF metadata extraction is not supported for MultiPointCoverage');
    }

    const metadata: GeoTiffMetadata = {
        width: 0,
        height: 0,
    };

    // Extract grid dimensions
    const limits = coverage.domainSet.limits;
    metadata.width = limits.high[0] - limits.low[0] + 1;
    metadata.height = limits.high[1] - limits.low[1] + 1;

    // Extract bounding box
    if (coverage.boundedBy) {
        metadata.bbox = coverage.boundedBy.bbox as [number, number, number, number];
    }

    // Extract CRS
    if (coverage.type === 'RectifiedGridCoverage' && coverage.domainSet.srsName) {
        metadata.crs = coverage.domainSet.srsName;
    }

    // Extract origin and transformation for RectifiedGridCoverage
    if (coverage.type === 'RectifiedGridCoverage') {
        metadata.origin = coverage.domainSet.origin;

        // Calculate affine transformation matrix
        const offsetVectors = coverage.domainSet.offsetVectors;
        if (offsetVectors.length >= 2) {
            // GeoTIFF affine transform: [a, b, c, d, e, f]
            // x_geo = a * x_pixel + b * y_pixel + c
            // y_geo = d * x_pixel + e * y_pixel + f
            metadata.transform = [
                offsetVectors[0][0], // a: pixel width (x-direction)
                offsetVectors[1][0], // b: rotation/skew (x)
                metadata.origin[0],   // c: x-origin
                offsetVectors[0][1], // d: rotation/skew (y)
                offsetVectors[1][1], // e: pixel height (y-direction, usually negative)
                metadata.origin[1],   // f: y-origin
            ];

            // Calculate pixel resolution
            metadata.resolution = [
                Math.sqrt(offsetVectors[0][0] ** 2 + offsetVectors[0][1] ** 2),
                Math.sqrt(offsetVectors[1][0] ** 2 + offsetVectors[1][1] ** 2),
            ];

            // Calculate rotation if present
            if (offsetVectors[0][1] !== 0 || offsetVectors[1][0] !== 0) {
                metadata.rotation = Math.atan2(offsetVectors[0][1], offsetVectors[0][0]) * (180 / Math.PI);
            }
        }
    }

    // Extract band information from rangeType
    if (coverage.rangeType && coverage.rangeType.field) {
        metadata.bands = coverage.rangeType.field.length;
        metadata.bandInfo = coverage.rangeType.field.map(field => ({
            name: field.name,
            dataType: field.dataType,
            uom: field.uom,
            description: field.description,
        }));
    }

    return metadata;
}

/**
 * Calculate world coordinates from pixel coordinates using affine transformation
 */
export function pixelToWorld(
    pixelX: number,
    pixelY: number,
    metadata: GeoTiffMetadata
): [number, number] | null {
    if (!metadata.transform) {
        return null;
    }

    const [a, b, c, d, e, f] = metadata.transform;
    const worldX = a * pixelX + b * pixelY + c;
    const worldY = d * pixelX + e * pixelY + f;

    return [worldX, worldY];
}

/**
 * Calculate pixel coordinates from world coordinates using affine transformation
 */
export function worldToPixel(
    worldX: number,
    worldY: number,
    metadata: GeoTiffMetadata
): [number, number] | null {
    if (!metadata.transform) {
        return null;
    }

    const [a, b, c, d, e, f] = metadata.transform;

    // Inverse affine transformation
    const det = a * e - b * d;
    if (det === 0) {
        return null; // Singular matrix
    }

    const pixelX = (e * (worldX - c) - b * (worldY - f)) / det;
    const pixelY = (-d * (worldX - c) + a * (worldY - f)) / det;

    return [pixelX, pixelY];
}
