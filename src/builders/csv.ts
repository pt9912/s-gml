/**
 * CSV Builder
 *
 * Converts GML to CSV format with WKT geometries
 * Suitable for import into spreadsheets, databases, and GIS tools
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

export interface CsvRow {
    id?: string;
    geometry: string; // WKT format
    [key: string]: any; // Additional properties
}

export interface CsvOutput {
    type: 'CSV';
    headers: string[];
    rows: CsvRow[];
}

export class CsvBuilder implements Builder<string, CsvOutput, string> {
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
     * Convert Envelope to CSV row with WKT Polygon
     */
    buildEnvelope(gml: GmlEnvelope): CsvOutput {
        const [minX, minY, maxX, maxY] = gml.bbox;
        const wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;

        return {
            type: 'CSV',
            headers: ['geometry', 'type', 'minX', 'minY', 'maxX', 'maxY', 'srsName'],
            rows: [{
                geometry: wkt,
                type: 'Envelope',
                minX,
                minY,
                maxX,
                maxY,
                srsName: gml.srsName || '',
            }],
        };
    }

    /**
     * Convert Box to CSV row
     */
    buildBox(gml: GmlBox): CsvOutput {
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
     * Convert RectifiedGridCoverage to CSV row
     */
    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): CsvOutput {
        const properties: any = {
            id: gml.id,
            type: 'RectifiedGridCoverage',
            dimension: gml.domainSet.dimension,
            srsName: gml.domainSet.srsName,
            gridLowX: gml.domainSet.limits.low[0],
            gridLowY: gml.domainSet.limits.low[1],
            gridHighX: gml.domainSet.limits.high[0],
            gridHighY: gml.domainSet.limits.high[1],
            originX: gml.domainSet.origin[0],
            originY: gml.domainSet.origin[1],
            offsetVector1X: gml.domainSet.offsetVectors[0][0],
            offsetVector1Y: gml.domainSet.offsetVectors[0][1],
            offsetVector2X: gml.domainSet.offsetVectors[1][0],
            offsetVector2Y: gml.domainSet.offsetVectors[1][1],
        };

        if (gml.rangeSet.file) {
            properties.dataFile = gml.rangeSet.file.fileName;
            properties.fileStructure = gml.rangeSet.file.fileStructure;
        }

        if (gml.rangeType?.field) {
            properties.bands = gml.rangeType.field.map(f => f.name).join(';');
        }

        let wkt = '';
        if (gml.boundedBy) {
            const [minX, minY, maxX, maxY] = gml.boundedBy.bbox;
            wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
        }

        properties.geometry = wkt;

        return {
            type: 'CSV',
            headers: Object.keys(properties),
            rows: [properties],
        };
    }

    /**
     * Convert GridCoverage to CSV row
     */
    buildGridCoverage(gml: GmlGridCoverage): CsvOutput {
        const properties: any = {
            id: gml.id,
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

        let wkt = '';
        if (gml.boundedBy) {
            const [minX, minY, maxX, maxY] = gml.boundedBy.bbox;
            wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
        }

        properties.geometry = wkt;

        return {
            type: 'CSV',
            headers: Object.keys(properties),
            rows: [properties],
        };
    }

    /**
     * Convert ReferenceableGridCoverage to CSV row
     */
    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): CsvOutput {
        const properties: any = {
            id: gml.id,
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

        let wkt = '';
        if (gml.boundedBy) {
            const [minX, minY, maxX, maxY] = gml.boundedBy.bbox;
            wkt = `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
        }

        properties.geometry = wkt;

        return {
            type: 'CSV',
            headers: Object.keys(properties),
            rows: [properties],
        };
    }

    /**
     * Convert MultiPointCoverage to CSV row
     */
    buildMultiPointCoverage(gml: GmlMultiPointCoverage): CsvOutput {
        const wkt = this.buildMultiPoint(gml.domainSet);

        const properties: any = {
            id: gml.id,
            type: 'MultiPointCoverage',
            geometry: wkt,
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
            type: 'CSV',
            headers: Object.keys(properties),
            rows: [properties],
        };
    }

    /**
     * Convert Feature to CSV row
     */
    buildFeature(gml: GmlFeature): CsvOutput {
        const geometryWkt = this.buildGeometry(gml.geometry);

        const row: CsvRow = {
            id: gml.id,
            geometry: geometryWkt as string,
            ...gml.properties,
        };

        if (gml.boundedBy) {
            row.bbox = gml.boundedBy.bbox.join(',');
        }

        const headers = ['id', 'geometry', ...Object.keys(gml.properties)];
        if (gml.boundedBy) {
            headers.push('bbox');
        }

        return {
            type: 'CSV',
            headers,
            rows: [row],
        };
    }

    /**
     * Convert FeatureCollection to CSV string
     */
    buildFeatureCollection(gml: GmlFeatureCollection): string {
        if (gml.features.length === 0) {
            return 'id,geometry\n';
        }

        // Collect all unique property keys
        const allKeys = new Set<string>(['id', 'geometry']);
        gml.features.forEach(feature => {
            Object.keys(feature.properties).forEach(key => allKeys.add(key));
            if (feature.boundedBy) {
                allKeys.add('bbox');
            }
        });

        const headers = Array.from(allKeys);

        // Build CSV rows
        const rows = gml.features.map(feature => {
            const featureOutput = this.buildFeature(feature);
            return featureOutput.rows[0];
        });

        // Convert to CSV string
        return this.toCsvString(headers, rows);
    }

    /**
     * Helper: Convert geometry to WKT
     */
    private buildGeometry(gml: GmlGeometry): string | CsvOutput {
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

    /**
     * Helper: Convert headers and rows to CSV string
     */
    private toCsvString(headers: string[], rows: CsvRow[]): string {
        const escapeCsv = (value: any): string => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headerLine = headers.map(h => escapeCsv(h)).join(',');
        const dataLines = rows.map(row =>
            headers.map(h => escapeCsv(row[h])).join(',')
        ).join('\n');

        return `${headerLine}\n${dataLines}`;
    }
}
