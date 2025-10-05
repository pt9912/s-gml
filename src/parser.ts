import { parseXml, detectGmlVersion, parseCoordinates } from './utils.js';
import {
    Builder,
    GmlBox,
    GmlConvertOptions,
    GmlCurve,
    GmlEnvelope,
    GmlFeature,
    GmlFeatureCollection,
    GmlGeometry,
    GmlLinearRing,
    GmlLineString,
    GmlMultiLineString,
    GmlMultiPoint,
    GmlMultiPolygon,
    GmlPoint,
    GmlPolygon,
    GmlSurface,
    GmlVersion,
    Feature,
    FeatureCollection,
    Geometry,
} from './types.js';
import { getBuilder } from './builders/index.js';
import { generateGml } from './generator.js';

interface GeometrySearchResult {
    key: string;
    value: any;
    featurePropertyKey?: string;
}

const GEOMETRY_ELEMENT_NAMES = new Set([
    'Point',
    'LineString',
    'Polygon',
    'LinearRing',
    'Envelope',
    'Box',
    'Curve',
    'Surface',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
]);

export class GmlParser {
    private builder: Builder;

    constructor(targetFormat: string = 'geojson') {
        this.builder = getBuilder(targetFormat);
    }

    async parse(xml: string): Promise<Geometry | Feature | FeatureCollection> {
        const doc = await parseXml(xml);
        const version = detectGmlVersion(doc);
        const gmlObject = this.parseGml(doc, version);
        return this.toGeoJson(gmlObject);
    }

    async convert(xml: string, options: GmlConvertOptions): Promise<string> {
        const { outputVersion, prettyPrint = false } = options;
        const doc = await parseXml(xml);
        const inputVersion = options.inputVersion || detectGmlVersion(doc);
        const gmlObject = this.parseGml(doc, inputVersion);
        return generateGml(gmlObject, outputVersion, prettyPrint);
    }

    async convertGeometry(gmlObject: GmlGeometry | GmlFeature | GmlFeatureCollection, options: Pick<GmlConvertOptions, 'outputVersion' | 'prettyPrint'>): Promise<string> {
        return generateGml(gmlObject, options.outputVersion, options.prettyPrint);
    }

    private parseGml(doc: any, version: GmlVersion): GmlGeometry | GmlFeature | GmlFeatureCollection {
        const entry = this.findFirstGmlEntry(doc);
        if (!entry) throw new Error('No GML geometry found');
        return this.parseElement(entry.key, entry.value, version);
    }

    private parseElement(key: string, value: any, version: GmlVersion): GmlGeometry | GmlFeature | GmlFeatureCollection {
        const element = this.normalizeElement(value);
        const name = this.getLocalName(key, element);

        switch (name) {
            case 'Point':
                return this.parsePoint(element, version);
            case 'LineString':
                return this.parseLineString(element, version);
            case 'Polygon':
                return this.parsePolygon(element, version);
            case 'LinearRing':
                return this.parseLinearRing(element, version);
            case 'Envelope':
                return this.parseEnvelope(element, version);
            case 'Box':
                return this.parseBox(element, version);
            case 'Curve':
                return this.parseCurve(element, version);
            case 'Surface':
                return this.parseSurface(element, version);
            case 'MultiSurface':
                return this.parseMultiSurface(element, version);
            case 'MultiPoint':
                return this.parseMultiPoint(element, version);
            case 'MultiLineString':
                return this.parseMultiLineString(element, version);
            case 'MultiPolygon':
                return this.parseMultiPolygon(element, version);
            case 'FeatureCollection':
                return this.parseFeatureCollection(element, version);
            default:
                throw new Error(`Unsupported GML element: ${name}`);
        }
    }

    private parsePoint(element: any, version: GmlVersion): GmlPoint {
        const srsName = element.$?.srsName;
        const srsDimension = this.parseDimension(element.$?.srsDimension);
        const source = version === '2.1.2' ? element['gml:coordinates']?._ : element['gml:pos']?._;
        if (typeof source !== 'string') throw new Error('Invalid GML Point');
        const tuples = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension);
        const [coordinates] = tuples;
        if (!coordinates) throw new Error('Invalid GML Point');
        return { type: 'Point', coordinates, srsName, version };
    }

    private parseLineString(element: any, version: GmlVersion): GmlLineString {
        const srsName = element.$?.srsName;
        const srsDimension = this.parseDimension(element.$?.srsDimension);
        const source = version === '2.1.2' ? element['gml:coordinates']?._ : element['gml:posList']?._;
        if (typeof source !== 'string') throw new Error('Invalid GML LineString');
        const coordinates = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension);
        return { type: 'LineString', coordinates, srsName, version };
    }

    private parsePolygon(element: any, version: GmlVersion): GmlPolygon {
        const srsName = element.$?.srsName;
        const srsDimension = this.parseDimension(element.$?.srsDimension);
        const coordinates = this.extractPolygonCoordinates(element, version, srsDimension);
        return { type: 'Polygon', coordinates, srsName, version };
    }

    private parseLinearRing(element: any, version: GmlVersion): GmlLinearRing {
        const srsName = element.$?.srsName;
        const srsDimension = this.parseDimension(element.$?.srsDimension);
        const source = version === '2.1.2' ? element['gml:coordinates']?._ : element['gml:posList']?._;
        if (typeof source !== 'string') throw new Error('Invalid GML LinearRing');
        const coordinates = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension);
        return { type: 'LinearRing', coordinates, srsName, version };
    }

    private parseEnvelope(element: any, version: GmlVersion): GmlEnvelope {
        const lower = element['gml:lowerCorner']?._;
        const upper = element['gml:upperCorner']?._;
        if (typeof lower !== 'string' || typeof upper !== 'string') throw new Error('Invalid GML Envelope');
        const lowerVals = lower.trim().split(/\s+/).map(Number);
        const upperVals = upper.trim().split(/\s+/).map(Number);
        if (lowerVals.length < 2 || upperVals.length < 2) throw new Error('Invalid GML Envelope');
        const bbox: [number, number, number, number] = [lowerVals[0], lowerVals[1], upperVals[0], upperVals[1]];
        return { type: 'Envelope', bbox, srsName: element.$?.srsName, version };
    }

    private parseBox(element: any, version: GmlVersion): GmlBox {
        const coordinatesText = element['gml:coordinates']?._;
        if (typeof coordinatesText !== 'string') throw new Error('Invalid GML Box');
        const values = coordinatesText.trim().split(/\s+/).map(Number);
        if (values.length < 4) throw new Error('Invalid GML Box');
        return { type: 'Box', coordinates: [values[0], values[1], values[2], values[3]], srsName: element.$?.srsName, version };
    }

    private parseCurve(element: any, version: GmlVersion): GmlCurve {
        const segmentNodes = this.ensureArray(element['gml:segments']?.['gml:LineStringSegment']);
        if (!segmentNodes.length) throw new Error('Invalid GML Curve');

        const coordinates: number[][] = segmentNodes.map(segment => {
            const srsDimension = this.parseDimension(segment.$?.srsDimension) || this.parseDimension(element.$?.srsDimension);
            const source = segment['gml:posList']?._ ?? segment['gml:coordinates']?._;
            if (typeof source !== 'string') throw new Error('Invalid GML LineStringSegment');
            return this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension);
        }).flat();

        return { type: 'Curve', coordinates, srsName: element.$?.srsName, version };
    }

    private parseSurface(element: any, version: GmlVersion): GmlSurface {
        const patchNodes = this.ensureArray(element['gml:patches']?.['gml:PolygonPatch']);
        if (!patchNodes.length) throw new Error('Invalid GML Surface');

        const patches: GmlPolygon[] = patchNodes.map(patch => {
            const polygon = this.parsePolygon(patch, version);
            return polygon;
        });

        return { type: 'Surface', patches, srsName: element.$?.srsName, version };
    }

    private parseMultiSurface(element: any, version: GmlVersion): GmlMultiPolygon {
        const srsName = element.$?.srsName;
        const polygons: number[][][][] = [];

        const surfaceMembers = this.ensureArray(element['gml:surfaceMember']);
        surfaceMembers.forEach(member => {
            const surfaceNode = this.normalizeElement(member['gml:Surface'] ?? member['gml:Polygon']);
            if (!surfaceNode) return;
            if (surfaceNode['#name'] === 'Polygon' || surfaceNode['gml:exterior']) {
                polygons.push(this.parsePolygon(surfaceNode, version).coordinates);
            } else {
                const surface = this.parseSurface(surfaceNode, version);
                surface.patches.forEach(patch => polygons.push(patch.coordinates));
            }
        });

        const surfaceMembersContainer = element['gml:surfaceMembers'];
        if (surfaceMembersContainer) {
            const containerEntries = this.ensureArray(surfaceMembersContainer);
            containerEntries.forEach(container => {
                const surfaceNodes = this.ensureArray(container['gml:Surface']);
                surfaceNodes.forEach(node => {
                    const surface = this.parseSurface(node, version);
                    surface.patches.forEach(patch => polygons.push(patch.coordinates));
                });
                const polygonNodes = this.ensureArray(container['gml:Polygon']);
                polygonNodes.forEach(node => {
                    polygons.push(this.parsePolygon(node, version).coordinates);
                });
            });
        }

        return { type: 'MultiPolygon', coordinates: polygons, srsName, version };
    }

    private parseMultiPoint(element: any, version: GmlVersion): GmlMultiPoint {
        const srsName = element.$?.srsName;

        if (version === '2.1.2') {
            const srsDimension = this.parseDimension(element.$?.srsDimension);
            const source = element['gml:coordinates']?._;
            if (typeof source !== 'string') throw new Error('Invalid GML MultiPoint');
            const coordinates = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension) as number[][];
            return { type: 'MultiPoint', coordinates, srsName, version };
        }

        const memberNodes = this.ensureArray(element['gml:pointMember']);
        const membersContainer = element['gml:pointMembers'];

        const coordinates: number[][] = [];

        memberNodes.forEach(member => {
            const pointNode = this.normalizeElement(member['gml:Point']);
            if (!pointNode) return;
            coordinates.push(this.parsePoint(pointNode, version).coordinates);
        });

        if (membersContainer) {
            const containerEntries = this.ensureArray(membersContainer);
            containerEntries.forEach(container => {
                const pointNodes = this.ensureArray(container['gml:Point']);
                pointNodes.forEach(node => {
                    coordinates.push(this.parsePoint(node, version).coordinates);
                });
            });
        }

        return { type: 'MultiPoint', coordinates, srsName, version };
    }

    private parseMultiLineString(element: any, version: GmlVersion): GmlMultiLineString {
        const srsName = element.$?.srsName;

        if (version === '2.1.2') {
            const srsDimension = this.parseDimension(element.$?.srsDimension);
            const source = element['gml:coordinates']?._;
            if (typeof source !== 'string') throw new Error('Invalid GML MultiLineString');
            const lines = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension) as number[][];
            return { type: 'MultiLineString', coordinates: [lines], srsName, version };
        }

        const lineStrings: number[][][] = [];
        const members = this.ensureArray(element['gml:lineStringMember']);
        members.forEach(member => {
            const lineNode = this.normalizeElement(member['gml:LineString']);
            if (!lineNode) return;
            lineStrings.push(this.parseLineString(lineNode, version).coordinates);
        });

        const membersContainer = element['gml:lineStringMembers'];
        if (membersContainer) {
            const containerEntries = this.ensureArray(membersContainer);
            containerEntries.forEach(container => {
                const lineNodes = this.ensureArray(container['gml:LineString']);
                lineNodes.forEach(lineNode => {
                    lineStrings.push(this.parseLineString(lineNode, version).coordinates);
                });
            });
        }

        return { type: 'MultiLineString', coordinates: lineStrings, srsName, version };
    }

    private parseMultiPolygon(element: any, version: GmlVersion): GmlMultiPolygon {
        const srsName = element.$?.srsName;

        const polygons: number[][][][] = [];
        const members = this.ensureArray(element['gml:polygonMember']);
        members.forEach(member => {
            const polygonNode = this.normalizeElement(member['gml:Polygon']);
            if (!polygonNode) return;
            polygons.push(this.parsePolygon(polygonNode, version).coordinates);
        });

        const membersContainer = element['gml:polygonMembers'];
        if (membersContainer) {
            const containerEntries = this.ensureArray(membersContainer);
            containerEntries.forEach(container => {
                const polygonNodes = this.ensureArray(container['gml:Polygon']);
                polygonNodes.forEach(node => {
                    polygons.push(this.parsePolygon(node, version).coordinates);
                });
            });
        }

        return { type: 'MultiPolygon', coordinates: polygons, srsName, version };
    }

    private parseFeatureCollection(element: any, version: GmlVersion): GmlFeatureCollection {
        const featureMembers = this.ensureArray(element['gml:featureMember']);
        const features: GmlFeature[] = featureMembers.map(member => this.parseFeatureMember(member, version));

        const featureMembersContainer = element['gml:featureMembers'];
        if (featureMembersContainer) {
            const containers = this.ensureArray(featureMembersContainer);
            containers.forEach(container => {
                for (const [key, value] of Object.entries(container)) {
                    if (key.startsWith('gml:')) continue;
                    const feature = this.parseFeatureElement(key, value as Record<string, any>, version);
                    features.push(feature);
                }
            });
        }

        const boundsNode = element['gml:boundedBy'];
        let bounds: GmlEnvelope | undefined;
        if (boundsNode) {
            const envelopeNode = boundsNode['gml:Envelope'] ?? boundsNode;
            bounds = this.parseEnvelope(this.normalizeElement(envelopeNode), version);
        }

        return { type: 'FeatureCollection', features, bounds, version };
    }

    private parseFeatureMember(member: any, version: GmlVersion): GmlFeature {
        const entry = Object.entries(member).find(([key]) => !key.startsWith('$'));
        if (!entry) throw new Error('Invalid GML featureMember');
        return this.parseFeatureElement(entry[0], entry[1] as Record<string, any>, version);
    }

    private parseFeatureElement(name: string, element: Record<string, any>, version: GmlVersion): GmlFeature {
        const geometryNode = this.findGeometryNode(element);
        if (!geometryNode) throw new Error(`No geometry found for feature ${name}`);
        const geometry = this.parseElement(geometryNode.key, geometryNode.value, version) as GmlGeometry;

        const properties = this.extractFeatureProperties(element, geometryNode.featurePropertyKey ?? geometryNode.key);

        const feature: GmlFeature = {
            id: element.$?.['gml:id'],
            geometry,
            properties,
            version,
        };

        const boundedByNode = element['gml:boundedBy'];
        if (boundedByNode) {
            const envelopeNode = boundedByNode['gml:Envelope'] ?? boundedByNode;
            feature.boundedBy = this.parseEnvelope(this.normalizeElement(envelopeNode), version);
        }

        return feature;
    }

    private extractPolygonCoordinates(element: any, version: GmlVersion, srsDimension: number): number[][][] {
        if (version === '2.1.2') {
            const outerText = element['gml:outerBoundaryIs']?.['gml:LinearRing']?.['gml:coordinates']?._;
            if (typeof outerText !== 'string') throw new Error('Invalid GML Polygon');
            const exteriorRing = this.toCoordinateTuples(parseCoordinates(outerText, version, srsDimension), srsDimension);
            const innerBoundaries = this.ensureArray(element['gml:innerBoundaryIs']);
            const interiorRings = innerBoundaries.map(interior => {
                const text = interior['gml:LinearRing']?.['gml:coordinates']?._;
                if (typeof text !== 'string') return [];
                return this.toCoordinateTuples(parseCoordinates(text, version, srsDimension), srsDimension);
            }).filter(ring => ring.length > 0);
            return [exteriorRing, ...interiorRings];
        }

        const exteriorText = element['gml:exterior']?.['gml:LinearRing']?.['gml:posList']?._;
        if (typeof exteriorText !== 'string') throw new Error('Invalid GML Polygon');
        const exteriorRing = this.toCoordinateTuples(parseCoordinates(exteriorText, version, srsDimension), srsDimension);
        const interiors = this.ensureArray(element['gml:interior']);
        const interiorRings = interiors.map(interior => {
            const text = interior['gml:LinearRing']?.['gml:posList']?._;
            if (typeof text !== 'string') return [];
            return this.toCoordinateTuples(parseCoordinates(text, version, srsDimension), srsDimension);
        }).filter(ring => ring.length > 0);
        return [exteriorRing, ...interiorRings];
    }

    private toGeoJson(gmlObject: GmlGeometry | GmlFeature | GmlFeatureCollection): Geometry | Feature | FeatureCollection {
        if (this.isFeatureCollection(gmlObject)) {
            return {
                type: 'FeatureCollection',
                features: gmlObject.features.map(feature => this.toGeoJsonFeature(feature)),
            };
        }

        if (this.isFeature(gmlObject)) {
            return this.toGeoJsonFeature(gmlObject);
        }

        return this.geometryToGeoJson(gmlObject);
    }

    private toGeoJsonFeature(feature: GmlFeature): Feature {
        const geometryResult = this.geometryToGeoJson(feature.geometry);
        let geometry: Geometry;
        let properties = { ...feature.properties };

        if ((geometryResult as Feature).type === 'Feature') {
            const featureGeometry = geometryResult as Feature;
            geometry = featureGeometry.geometry as Geometry;
            properties = { ...featureGeometry.properties, ...properties };
        } else {
            geometry = geometryResult as Geometry;
        }

        const geoJsonFeature: Feature = {
            type: 'Feature',
            geometry,
            properties,
        };

        if (feature.id) {
            geoJsonFeature.id = feature.id;
        }

        if (feature.boundedBy) {
            geoJsonFeature.bbox = feature.boundedBy.bbox;
        }

        return geoJsonFeature;
    }

    private geometryToGeoJson(geometry: GmlGeometry): Geometry | Feature {
        switch (geometry.type) {
            case 'Point':
                return this.builder.buildPoint(geometry);
            case 'LineString':
                return this.builder.buildLineString(geometry);
            case 'Polygon':
                return this.builder.buildPolygon(geometry);
            case 'LinearRing':
                return this.builder.buildLinearRing(geometry);
            case 'Envelope':
                return this.builder.buildEnvelope(geometry);
            case 'Box':
                return this.builder.buildBox(geometry);
            case 'Curve':
                return this.builder.buildCurve(geometry);
            case 'Surface':
                return this.builder.buildSurface(geometry);
            case 'MultiPoint':
                return this.builder.buildMultiPoint(geometry);
            case 'MultiLineString':
                return this.builder.buildMultiLineString(geometry);
            case 'MultiPolygon':
                return this.builder.buildMultiPolygon(geometry);
            default:
                throw new Error(`Unsupported geometry type: ${(geometry as any).type}`);
        }
    }

    private findFirstGmlEntry(doc: any): { key: string; value: any } | undefined {
        if (!doc || typeof doc !== 'object') return undefined;
        for (const [key, value] of Object.entries(doc)) {
            if (key.startsWith('gml:')) {
                return { key, value };
            }
        }
        return undefined;
    }

    private findGeometryNode(featureElement: Record<string, any>): GeometrySearchResult | null {
        for (const [key, value] of Object.entries(featureElement)) {
            if (key === '$' || key === '#name') continue;
            const result = this.searchGeometry(value, key);
            if (result) {
                return result;
            }
        }
        return null;
    }

    private searchGeometry(node: any, featurePropertyKey?: string): GeometrySearchResult | null {
        if (!node) return null;
        if (Array.isArray(node)) {
            for (const item of node) {
                const result = this.searchGeometry(item, featurePropertyKey);
                if (result) return result;
            }
            return null;
        }
        if (typeof node !== 'object') return null;

        for (const [key, value] of Object.entries(node)) {
            if (key.startsWith('gml:')) {
                const name = this.getLocalName(key, value);
                if (GEOMETRY_ELEMENT_NAMES.has(name)) {
                    return { key, value, featurePropertyKey };
                }
            }
            const result = this.searchGeometry(value, featurePropertyKey);
            if (result) return result;
        }

        return null;
    }

    private extractFeatureProperties(featureElement: Record<string, any>, geometryPropertyKey?: string): Record<string, any> {
        const properties: Record<string, any> = {};

        if (featureElement.$) {
            for (const [key, value] of Object.entries(featureElement.$)) {
                if (key !== 'gml:id') {
                    properties[key] = this.normalizePropertyValue(value);
                }
            }
        }

        for (const [key, value] of Object.entries(featureElement)) {
            if (key === '$' || key === '#name') continue;
            if (geometryPropertyKey && key === geometryPropertyKey) continue;
            if (key.startsWith('gml:')) continue;
            properties[key] = this.normalizePropertyValue(value);
        }

        return properties;
    }

    private normalizePropertyValue(value: any): any {
        if (value === null || value === undefined) return value;

        if (Array.isArray(value)) {
            return value.map(item => this.normalizePropertyValue(item));
        }

        if (typeof value === 'object') {
            if (typeof value._ === 'string') {
                return value._.trim();
            }
            return Object.fromEntries(
                Object.entries(value).map(([key, val]) => [key, this.normalizePropertyValue(val)])
            );
        }

        if (typeof value === 'string') {
            return value.trim();
        }

        return value;
    }

    private parseDimension(value: string | undefined): number {
        const parsed = value ? parseInt(value, 10) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
    }

    private ensureArray<T>(value: T | T[] | undefined): T[] {
        if (value === undefined || value === null) return [];
        return Array.isArray(value) ? value : [value];
    }

    private toCoordinateTuples(coords: number[] | number[][], dimension: number): number[][] {
        if (Array.isArray(coords) && Array.isArray(coords[0])) {
            return coords as number[][];
        }

        const flat = coords as number[];
        const tuples: number[][] = [];
        for (let i = 0; i < flat.length; i += dimension) {
            tuples.push(flat.slice(i, i + dimension));
        }
        return tuples;
    }

    private normalizeElement<T>(value: T | T[]): T {
        if (Array.isArray(value)) {
            if (!value.length) throw new Error('Unexpected empty GML element array');
            return value[0];
        }
        return value;
    }

    private getLocalName(key: string, element: any): string {
        if (element && typeof element === 'object' && typeof element['#name'] === 'string') {
            return element['#name'];
        }
        const parts = key.split(':');
        return parts[parts.length - 1];
    }

    private isFeatureCollection(value: GmlGeometry | GmlFeature | GmlFeatureCollection): value is GmlFeatureCollection {
        return (value as GmlFeatureCollection).type === 'FeatureCollection';
    }

    private isFeature(value: GmlGeometry | GmlFeature | GmlFeatureCollection): value is GmlFeature {
        return (value as GmlFeature).geometry !== undefined && (value as GmlFeature).properties !== undefined;
    }
}
