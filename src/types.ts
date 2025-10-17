import type { Feature as GeoJsonFeature, FeatureCollection as GeoJsonFeatureCollection, Geometry as GeoJsonGeometry } from 'geojson';

export type GmlVersion = '2.1.2' | '3.0' | '3.1' | '3.2' | '3.3';
export type GmlOutputVersion = '2.1.2' | '3.2';

export interface GmlPoint {
    type: 'Point';
    coordinates: number[];
    srsName?: string;
    version: GmlVersion;
}

export interface GmlLineString {
    type: 'LineString';
    coordinates: number[][];
    srsName?: string;
    version: GmlVersion;
}

export interface GmlPolygon {
    type: 'Polygon';
    coordinates: number[][][];
    srsName?: string;
    version: GmlVersion;
}

export interface GmlLinearRing {
    type: 'LinearRing';
    coordinates: number[][];
    srsName?: string;
    version: GmlVersion;
}

export interface GmlEnvelope {
    type: 'Envelope';
    bbox: [number, number, number, number]; // [minX, minY, maxX, maxY]
    srsName?: string;
    version: GmlVersion;
}

export interface GmlBox {
    type: 'Box';
    coordinates: [number, number, number, number]; // [minX, minY, maxX, maxY]
    srsName?: string;
    version: GmlVersion;
}

export interface GmlCurve {
    type: 'Curve';
    coordinates: number[][];
    srsName?: string;
    version: GmlVersion;
}

export interface GmlSurface {
    type: 'Surface';
    patches: GmlPolygon[]; // Approximation als Polygone
    srsName?: string;
    version: GmlVersion;
}

export interface GmlMultiPoint {
    type: 'MultiPoint';
    coordinates: number[][];
    srsName?: string;
    version: GmlVersion;
}

export interface GmlMultiLineString {
    type: 'MultiLineString';
    coordinates: number[][][];
    srsName?: string;
    version: GmlVersion;
}

export interface GmlMultiPolygon {
    type: 'MultiPolygon';
    coordinates: number[][][][];
    srsName?: string;
    version: GmlVersion;
}

// Coverage Types
export interface GmlGridEnvelope {
    low: number[];  // Grid coordinates of lower corner
    high: number[]; // Grid coordinates of upper corner
}

export interface GmlRectifiedGrid {
    id?: string;
    dimension: number;
    srsName?: string;
    limits: GmlGridEnvelope;
    axisLabels?: string[];
    origin: number[]; // Origin point in world coordinates
    offsetVectors: number[][]; // Pixel size and orientation vectors
}

export interface GmlGrid {
    id?: string;
    dimension: number;
    limits: GmlGridEnvelope;
    axisLabels?: string[];
}

export interface GmlRangeSet {
    data?: any; // Actual data values (could be binary, arrays, etc.)
    file?: {
        fileName: string;
        fileStructure?: string;
    };
}

export interface GmlRangeType {
    field?: Array<{
        name: string;
        dataType?: string;
        uom?: string; // Unit of measure
        description?: string;
    }>;
}

// Temporal axis support for time-series coverages
export interface GmlTemporalAxis {
    axisLabel: string; // e.g., "time", "t", "temporal"
    startTime: string; // ISO 8601 timestamp (e.g., "2024-01-01T00:00:00Z")
    endTime: string;   // ISO 8601 timestamp
    resolution?: string; // ISO 8601 duration (e.g., "P1D" for 1 day, "PT1H" for 1 hour)
    uom?: string; // Unit of measure (e.g., "ISO8601", "seconds", "days")
}

export interface GmlTemporalDomain {
    temporal: GmlTemporalAxis;
}

export interface GmlRectifiedGridCoverage {
    type: 'RectifiedGridCoverage';
    id?: string;
    boundedBy?: GmlEnvelope;
    domainSet: GmlRectifiedGrid;
    rangeSet: GmlRangeSet;
    rangeType?: GmlRangeType;
    temporal?: GmlTemporalAxis; // Optional temporal axis for time-series
    version: GmlVersion;
}

export interface GmlGridCoverage {
    type: 'GridCoverage';
    id?: string;
    boundedBy?: GmlEnvelope;
    domainSet: GmlGrid;
    rangeSet: GmlRangeSet;
    rangeType?: GmlRangeType;
    temporal?: GmlTemporalAxis; // Optional temporal axis for time-series
    version: GmlVersion;
}

export interface GmlReferenceableGridCoverage {
    type: 'ReferenceableGridCoverage';
    id?: string;
    boundedBy?: GmlEnvelope;
    domainSet: GmlGrid; // Extended with georeferencing info
    rangeSet: GmlRangeSet;
    rangeType?: GmlRangeType;
    temporal?: GmlTemporalAxis; // Optional temporal axis for time-series
    version: GmlVersion;
}

export interface GmlMultiPointCoverage {
    type: 'MultiPointCoverage';
    id?: string;
    boundedBy?: GmlEnvelope;
    domainSet: GmlMultiPoint; // Collection of arbitrarily distributed points
    rangeSet: GmlRangeSet;
    rangeType?: GmlRangeType;
    version: GmlVersion;
}

export interface GmlFeature {
    id?: string;
    geometry: GmlGeometry;
    properties: Record<string, any>;
    version: GmlVersion;
    boundedBy?: GmlEnvelope; // Für WFS-Features
}

export interface GmlFeatureCollection {
    type: 'FeatureCollection';
    features: GmlFeature[];
    version: GmlVersion;
    bounds?: GmlEnvelope; // Optionale Begrenzungsbox
}

export type GmlCoverage =
    | GmlRectifiedGridCoverage
    | GmlGridCoverage
    | GmlReferenceableGridCoverage
    | GmlMultiPointCoverage;

export type GmlGeometry =
    | GmlPoint
    | GmlLineString
    | GmlPolygon
    | GmlLinearRing
    | GmlEnvelope
    | GmlBox
    | GmlCurve
    | GmlSurface
    | GmlMultiPoint
    | GmlMultiLineString
    | GmlMultiPolygon;

export type Geometry = GeoJsonGeometry;
export type Feature = GeoJsonFeature<Geometry>;
export type FeatureCollection = GeoJsonFeatureCollection<Geometry>;

/**
 * Builder-Interface für die Transformation von GML zu verschiedenen Output-Formaten.
 *
 * Implementierungen dieses Interfaces können als `targetFormat` an den GmlParser
 * übergeben werden um custom Output-Formate zu erstellen.
 *
 * @typeParam TGeometry - Typ für Geometrie-Output (z.B. GeoJSON Geometry, WKT String)
 * @typeParam TFeature - Typ für Feature-Output (z.B. GeoJSON Feature, CSV Row)
 * @typeParam TFeatureCollection - Typ für FeatureCollection-Output
 *
 * @example
 * ```typescript
 * class MyCustomBuilder implements Builder<string, string, string> {
 *   buildPoint(gml: GmlPoint): string {
 *     return `POINT(${gml.coordinates.join(' ')})`;
 *   }
 *
 *   buildFeature(gml: GmlFeature): string {
 *     return `Feature ID: ${gml.id}`;
 *   }
 *
 *   buildFeatureCollection(gml: GmlFeatureCollection): string {
 *     return `Collection with ${gml.features.length} features`;
 *   }
 *
 *   // ... alle weiteren Methoden implementieren
 * }
 *
 * const parser = new GmlParser(new MyCustomBuilder());
 * const output = await parser.parse(gmlXml); // String output
 * ```
 *
 * @public
 * @category Builder
 * @interface
 */
export interface Builder<
    TGeometry = Geometry,
    TFeature = Feature,
    TFeatureCollection = FeatureCollection
> {
    /**
     * Baut ein Point-Objekt aus einem GmlPoint.
     * @param gml - GmlPoint zum Konvertieren
     * @returns Point im Zielformat
     */
    buildPoint(gml: GmlPoint): TGeometry;

    /**
     * Baut ein LineString-Objekt aus einem GmlLineString.
     * @param gml - GmlLineString zum Konvertieren
     * @returns LineString im Zielformat
     */
    buildLineString(gml: GmlLineString): TGeometry;

    /**
     * Baut ein Polygon-Objekt aus einem GmlPolygon.
     * @param gml - GmlPolygon zum Konvertieren
     * @returns Polygon im Zielformat
     */
    buildPolygon(gml: GmlPolygon): TGeometry;

    /**
     * Baut ein MultiPoint-Objekt aus einem GmlMultiPoint.
     * @param gml - GmlMultiPoint zum Konvertieren
     * @returns MultiPoint im Zielformat
     */
    buildMultiPoint(gml: GmlMultiPoint): TGeometry;

    /**
     * Baut ein MultiLineString-Objekt aus einem GmlMultiLineString.
     * @param gml - GmlMultiLineString zum Konvertieren
     * @returns MultiLineString im Zielformat
     */
    buildMultiLineString(gml: GmlMultiLineString): TGeometry;

    /**
     * Baut ein MultiPolygon-Objekt aus einem GmlMultiPolygon.
     * @param gml - GmlMultiPolygon zum Konvertieren
     * @returns MultiPolygon im Zielformat
     */
    buildMultiPolygon(gml: GmlMultiPolygon): TGeometry;

    /**
     * Baut ein LinearRing-Objekt aus einem GmlLinearRing.
     * @param gml - GmlLinearRing zum Konvertieren
     * @returns LinearRing im Zielformat (meist als LineString)
     */
    buildLinearRing(gml: GmlLinearRing): TGeometry;

    /**
     * Baut ein Feature-Objekt aus einem GmlEnvelope (Bounding Box).
     * @param gml - GmlEnvelope zum Konvertieren
     * @returns Feature mit bbox im Zielformat
     */
    buildEnvelope(gml: GmlEnvelope): TFeature;

    /**
     * Baut ein Feature-Objekt aus einem GmlBox.
     * @param gml - GmlBox zum Konvertieren
     * @returns Feature mit Box-Geometrie im Zielformat
     */
    buildBox(gml: GmlBox): TFeature;

    /**
     * Baut ein Curve-Objekt aus einem GmlCurve.
     * @param gml - GmlCurve zum Konvertieren
     * @returns Curve (meist als LineString) im Zielformat
     */
    buildCurve(gml: GmlCurve): TGeometry;

    /**
     * Baut ein Surface-Objekt aus einem GmlSurface.
     * @param gml - GmlSurface zum Konvertieren
     * @returns Surface (meist als MultiPolygon) im Zielformat
     */
    buildSurface(gml: GmlSurface): TGeometry;

    /**
     * Baut ein Feature aus einem RectifiedGridCoverage (georeferenziertes Raster).
     * @param gml - GmlRectifiedGridCoverage zum Konvertieren
     * @returns Feature mit Coverage-Metadaten im Zielformat
     */
    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): TFeature;

    /**
     * Baut ein Feature aus einem GridCoverage (nicht-georeferenziertes Raster).
     * @param gml - GmlGridCoverage zum Konvertieren
     * @returns Feature mit Coverage-Metadaten im Zielformat
     */
    buildGridCoverage(gml: GmlGridCoverage): TFeature;

    /**
     * Baut ein Feature aus einem ReferenceableGridCoverage (unregelmäßig georeferenziertes Raster).
     * @param gml - GmlReferenceableGridCoverage zum Konvertieren
     * @returns Feature mit Coverage-Metadaten im Zielformat
     */
    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): TFeature;

    /**
     * Baut ein Feature aus einem MultiPointCoverage (Coverage mit MultiPoint-Domäne).
     * @param gml - GmlMultiPointCoverage zum Konvertieren
     * @returns Feature mit Coverage-Metadaten im Zielformat
     */
    buildMultiPointCoverage(gml: GmlMultiPointCoverage): TFeature;

    /**
     * Baut ein Feature-Objekt aus einem GmlFeature.
     * @param gml - GmlFeature zum Konvertieren (inkl. Geometrie und Properties)
     * @returns Feature im Zielformat
     */
    buildFeature(gml: GmlFeature): TFeature;

    /**
     * Baut eine FeatureCollection aus einer GmlFeatureCollection.
     * @param gml - GmlFeatureCollection zum Konvertieren
     * @returns FeatureCollection im Zielformat
     */
    buildFeatureCollection(gml: GmlFeatureCollection): TFeatureCollection;
}

export interface GmlConvertOptions {
    inputVersion?: GmlVersion;
    outputVersion: GmlOutputVersion;
    prettyPrint?: boolean;
}
