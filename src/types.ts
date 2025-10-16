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

export interface GmlRectifiedGridCoverage {
    type: 'RectifiedGridCoverage';
    id?: string;
    boundedBy?: GmlEnvelope;
    domainSet: GmlRectifiedGrid;
    rangeSet: GmlRangeSet;
    rangeType?: GmlRangeType;
    version: GmlVersion;
}

export interface GmlGridCoverage {
    type: 'GridCoverage';
    id?: string;
    boundedBy?: GmlEnvelope;
    domainSet: GmlGrid;
    rangeSet: GmlRangeSet;
    rangeType?: GmlRangeType;
    version: GmlVersion;
}

export interface GmlReferenceableGridCoverage {
    type: 'ReferenceableGridCoverage';
    id?: string;
    boundedBy?: GmlEnvelope;
    domainSet: GmlGrid; // Extended with georeferencing info
    rangeSet: GmlRangeSet;
    rangeType?: GmlRangeType;
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

export interface Builder<
    TGeometry = Geometry,
    TFeature = Feature,
    TFeatureCollection = FeatureCollection
> {
    buildPoint(gml: GmlPoint): TGeometry;
    buildLineString(gml: GmlLineString): TGeometry;
    buildPolygon(gml: GmlPolygon): TGeometry;
    buildMultiPoint(gml: GmlMultiPoint): TGeometry;
    buildMultiLineString(gml: GmlMultiLineString): TGeometry;
    buildMultiPolygon(gml: GmlMultiPolygon): TGeometry;
    buildLinearRing(gml: GmlLinearRing): TGeometry;
    buildEnvelope(gml: GmlEnvelope): TFeature;
    buildBox(gml: GmlBox): TFeature;
    buildCurve(gml: GmlCurve): TGeometry;
    buildSurface(gml: GmlSurface): TGeometry;
    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): TFeature;
    buildGridCoverage(gml: GmlGridCoverage): TFeature;
    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): TFeature;
    buildMultiPointCoverage(gml: GmlMultiPointCoverage): TFeature;
    buildFeature(gml: GmlFeature): TFeature;
    buildFeatureCollection(gml: GmlFeatureCollection): TFeatureCollection;
}

export interface GmlConvertOptions {
    inputVersion?: GmlVersion;
    outputVersion: GmlOutputVersion;
    prettyPrint?: boolean;
}
