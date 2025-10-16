/**
 * WKT Builder
 *
 * Converts GML to Well-Known Text (WKT) format
 * WKT is a text markup language for representing vector geometry objects
 * Supported by PostGIS, QGIS, ArcGIS, and many other GIS tools
 *
 * Reference: OGC Simple Features Specification (99-036)
 */

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
    GmlGeometry,
} from '../types.js';

export interface WktFeature {
    wkt: string;
    properties: Record<string, any>;
    id?: string;
}

export interface WktCollection {
    features: WktFeature[];
}

export class WktBuilder implements Builder<string, WktFeature, WktCollection> {
    /**
     * Convert Point to WKT
     */
    buildPoint(gml: GmlPoint): string {
        const [x, y, z] = gml.coordinates;
        if (z !== undefined) {
            return `POINT Z (${x} ${y} ${z})`;
        }
        return `POINT (${x} ${y})`;
    }

    /**
     * Convert LineString to WKT
     */
    buildLineString(gml: GmlLineString): string {
        const coords = gml.coordinates.map(([x, y, z]) =>
            z !== undefined ? `${x} ${y} ${z}` : `${x} ${y}`
        ).join(', ');
        const hasZ = gml.coordinates.some(c => c[2] !== undefined);
        return hasZ ? `LINESTRING Z (${coords})` : `LINESTRING (${coords})`;
    }

    /**
     * Convert Polygon to WKT
     */
    buildPolygon(gml: GmlPolygon): string {
        const hasZ = gml.coordinates[0]?.some(c => c[2] !== undefined);
        const rings = gml.coordinates.map(ring => {
            const coords = ring.map(([x, y, z]) =>
                z !== undefined ? `${x} ${y} ${z}` : `${x} ${y}`
            ).join(', ');
            return `(${coords})`;
        }).join(', ');
        return hasZ ? `POLYGON Z (${rings})` : `POLYGON (${rings})`;
    }

    /**
     * Convert MultiPoint to WKT
     */
    buildMultiPoint(gml: GmlMultiPoint): string {
        const hasZ = gml.coordinates.some(c => c[2] !== undefined);
        const coords = gml.coordinates.map(([x, y, z]) =>
            z !== undefined ? `${x} ${y} ${z}` : `${x} ${y}`
        ).join(', ');
        return hasZ ? `MULTIPOINT Z (${coords})` : `MULTIPOINT (${coords})`;
    }

    /**
     * Convert MultiLineString to WKT
     */
    buildMultiLineString(gml: GmlMultiLineString): string {
        const hasZ = gml.coordinates[0]?.some(c => c[2] !== undefined);
        const lines = gml.coordinates.map(line => {
            const coords = line.map(([x, y, z]) =>
                z !== undefined ? `${x} ${y} ${z}` : `${x} ${y}`
            ).join(', ');
            return `(${coords})`;
        }).join(', ');
        return hasZ ? `MULTILINESTRING Z (${lines})` : `MULTILINESTRING (${lines})`;
    }

    /**
     * Convert MultiPolygon to WKT
     */
    buildMultiPolygon(gml: GmlMultiPolygon): string {
        const hasZ = gml.coordinates[0]?.[0]?.some(c => c[2] !== undefined);
        const polygons = gml.coordinates.map(polygon => {
            const rings = polygon.map(ring => {
                const coords = ring.map(([x, y, z]) =>
                    z !== undefined ? `${x} ${y} ${z}` : `${x} ${y}`
                ).join(', ');
                return `(${coords})`;
            }).join(', ');
            return `(${rings})`;
        }).join(', ');
        return hasZ ? `MULTIPOLYGON Z (${polygons})` : `MULTIPOLYGON (${polygons})`;
    }

    /**
     * Convert LinearRing to WKT (as LineString)
     */
    buildLinearRing(gml: GmlLinearRing): string {
        return this.buildLineString({
            type: 'LineString',
            coordinates: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert Envelope to WKT Feature with Polygon
     */
    buildEnvelope(gml: GmlEnvelope): WktFeature {
        const [minX, minY, maxX, maxY] = gml.bbox;
        const wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;

        return {
            wkt,
            properties: {
                type: 'Envelope',
                minX,
                minY,
                maxX,
                maxY,
                srsName: gml.srsName,
            },
        };
    }

    /**
     * Convert Box to WKT Feature
     */
    buildBox(gml: GmlBox): WktFeature {
        return this.buildEnvelope({
            type: 'Envelope',
            bbox: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert Curve to WKT LineString
     */
    buildCurve(gml: GmlCurve): string {
        return this.buildLineString({
            type: 'LineString',
            coordinates: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert Surface to WKT MultiPolygon
     */
    buildSurface(gml: GmlSurface): string {
        return this.buildMultiPolygon({
            type: 'MultiPolygon',
            coordinates: gml.patches.map(p => p.coordinates),
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert RectifiedGridCoverage to WKT Feature
     */
    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): WktFeature {
        let wkt = '';
        if (gml.boundedBy) {
            const [minX, minY, maxX, maxY] = gml.boundedBy.bbox;
            wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
        } else {
            // Use origin as point if no boundedBy
            const [x, y] = gml.domainSet.origin;
            wkt = `POINT (${x} ${y})`;
        }

        const properties: any = {
            type: 'RectifiedGridCoverage',
            dimension: gml.domainSet.dimension,
            srsName: gml.domainSet.srsName,
            gridLowX: gml.domainSet.limits.low[0],
            gridLowY: gml.domainSet.limits.low[1],
            gridHighX: gml.domainSet.limits.high[0],
            gridHighY: gml.domainSet.limits.high[1],
            originX: gml.domainSet.origin[0],
            originY: gml.domainSet.origin[1],
        };

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file.fileName;
            properties.fileStructure = gml.rangeSet.file.fileStructure;
        }

        if (gml.rangeType?.field) {
            properties.bands = gml.rangeType.field.map(f => f.name).join(';');
        }

        return {
            wkt,
            properties,
            id: gml.id,
        };
    }

    /**
     * Convert GridCoverage to WKT Feature
     */
    buildGridCoverage(gml: GmlGridCoverage): WktFeature {
        let wkt = '';
        if (gml.boundedBy) {
            const [minX, minY, maxX, maxY] = gml.boundedBy.bbox;
            wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
        } else {
            wkt = 'POINT (0 0)';
        }

        const properties: any = {
            type: 'GridCoverage',
            dimension: gml.domainSet.dimension,
            gridLowX: gml.domainSet.limits.low[0],
            gridLowY: gml.domainSet.limits.low[1],
            gridHighX: gml.domainSet.limits.high[0],
            gridHighY: gml.domainSet.limits.high[1],
        };

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file.fileName;
            properties.fileStructure = gml.rangeSet.file.fileStructure;
        }

        if (gml.rangeType?.field) {
            properties.bands = gml.rangeType.field.map(f => f.name).join(';');
        }

        return {
            wkt,
            properties,
            id: gml.id,
        };
    }

    /**
     * Convert ReferenceableGridCoverage to WKT Feature
     */
    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): WktFeature {
        let wkt = '';
        if (gml.boundedBy) {
            const [minX, minY, maxX, maxY] = gml.boundedBy.bbox;
            wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
        } else {
            wkt = 'POINT (0 0)';
        }

        const properties: any = {
            type: 'ReferenceableGridCoverage',
            dimension: gml.domainSet.dimension,
            gridLowX: gml.domainSet.limits.low[0],
            gridLowY: gml.domainSet.limits.low[1],
            gridHighX: gml.domainSet.limits.high[0],
            gridHighY: gml.domainSet.limits.high[1],
        };

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file.fileName;
            properties.fileStructure = gml.rangeSet.file.fileStructure;
        }

        if (gml.rangeType?.field) {
            properties.bands = gml.rangeType.field.map(f => f.name).join(';');
        }

        return {
            wkt,
            properties,
            id: gml.id,
        };
    }

    /**
     * Convert MultiPointCoverage to WKT Feature
     */
    buildMultiPointCoverage(gml: GmlMultiPointCoverage): WktFeature {
        const wkt = this.buildMultiPoint(gml.domainSet);

        const properties: any = {
            type: 'MultiPointCoverage',
            pointCount: gml.domainSet.coordinates.length,
            srsName: gml.domainSet.srsName,
        };

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file.fileName;
            properties.fileStructure = gml.rangeSet.file.fileStructure;
        }

        if (gml.rangeType?.field) {
            properties.bands = gml.rangeType.field.map(f => f.name).join(';');
        }

        return {
            wkt,
            properties,
            id: gml.id,
        };
    }

    /**
     * Convert Feature to WKT Feature
     */
    buildFeature(gml: GmlFeature): WktFeature {
        const geometryResult = this.buildGeometry(gml.geometry);

        let wkt: string;
        let properties = { ...gml.properties };

        if (typeof geometryResult === 'string') {
            wkt = geometryResult;
        } else {
            // It's a WktFeature (from Envelope/Box)
            wkt = geometryResult.wkt;
            properties = { ...geometryResult.properties, ...properties };
        }

        const feature: WktFeature = {
            wkt,
            properties,
        };

        if (gml.id) {
            feature.id = gml.id;
        }

        if (gml.boundedBy) {
            properties.bbox = gml.boundedBy.bbox.join(',');
        }

        return feature;
    }

    /**
     * Convert FeatureCollection to WKT Collection
     */
    buildFeatureCollection(gml: GmlFeatureCollection): WktCollection {
        return {
            features: gml.features.map(feature => this.buildFeature(feature)),
        };
    }

    /**
     * Helper: Convert geometry to WKT
     */
    private buildGeometry(gml: GmlGeometry): string | WktFeature {
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

/**
 * Helper function to convert WktCollection to JSON string
 */
export function wktCollectionToJson(collection: WktCollection, prettyPrint = false): string {
    return JSON.stringify(collection, null, prettyPrint ? 2 : 0);
}

/**
 * Helper function to convert WktCollection to CSV string
 */
export function wktCollectionToCsv(collection: WktCollection): string {
    if (collection.features.length === 0) {
        return 'id,wkt\n';
    }

    // Collect all unique property keys
    const allKeys = new Set<string>(['id', 'wkt']);
    collection.features.forEach(feature => {
        Object.keys(feature.properties).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);

    const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerLine = headers.map(h => escapeCsv(h)).join(',');
    const dataLines = collection.features.map(feature => {
        const row: any = { id: feature.id, wkt: feature.wkt, ...feature.properties };
        return headers.map(h => escapeCsv(row[h])).join(',');
    }).join('\n');

    return `${headerLine}\n${dataLines}`;
}
