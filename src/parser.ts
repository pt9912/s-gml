import { parseXml, detectGmlVersion, parseCoordinates } from './utils.js';
import {
    Builder,
    GmlBox,
    GmlConvertOptions,
    GmlCoverage,
    GmlCurve,
    GmlEnvelope,
    GmlFeature,
    GmlFeatureCollection,
    GmlGeometry,
    GmlGridCoverage,
    GmlLinearRing,
    GmlLineString,
    GmlMultiLineString,
    GmlMultiPoint,
    GmlMultiPointCoverage,
    GmlMultiPolygon,
    GmlPoint,
    GmlPolygon,
    GmlRectifiedGridCoverage,
    GmlReferenceableGridCoverage,
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

// Coverage element names for future use (e.g., searching)
// const COVERAGE_ELEMENT_NAMES = new Set([
//     'RectifiedGridCoverage',
//     'GridCoverage',
//     'ReferenceableGridCoverage',
//     'GMLJP2RectifiedGridCoverage',
// ]);

export class GmlParser {
    private builder: Builder;

    constructor(targetFormat: string | Builder = 'geojson') {
        this.builder = typeof targetFormat === 'string' ? getBuilder(targetFormat) : targetFormat;
    }

    async parse(xml: string): Promise<Geometry | Feature | FeatureCollection> {
        const doc = await parseXml(xml);
        const version = detectGmlVersion(doc);
        const gmlObject = this.parseGml(doc, version);
        return this.toGeoJson(gmlObject);
    }

    async parseFromUrl(url: string): Promise<Geometry | Feature | FeatureCollection> {
        const xml = await this.fetchXml(url);
        return this.parse(xml);
    }

    async convert(xml: string, options: GmlConvertOptions): Promise<string> {
        const { outputVersion, prettyPrint = false } = options;
        const doc = await parseXml(xml);
        const inputVersion = options.inputVersion || detectGmlVersion(doc);
        const gmlObject = this.parseGml(doc, inputVersion);
        return generateGml(gmlObject, outputVersion, prettyPrint);
    }

    async convertFromUrl(url: string, options: GmlConvertOptions): Promise<string> {
        const xml = await this.fetchXml(url);
        return this.convert(xml, options);
    }

    private async fetchXml(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch GML from ${url} (${response.status} ${response.statusText})`);
        }
        return await response.text();
    }

    async convertGeometry(gmlObject: GmlGeometry | GmlFeature | GmlFeatureCollection, options: Pick<GmlConvertOptions, 'outputVersion' | 'prettyPrint'>): Promise<string> {
        return generateGml(gmlObject, options.outputVersion, options.prettyPrint);
    }

    private parseGml(doc: any, version: GmlVersion): GmlGeometry | GmlFeature | GmlFeatureCollection {
        const collectionNode = this.findFeatureCollectionNode(doc);
        if (collectionNode) {
            return this.parseFeatureCollection(collectionNode, version);
        }

        const entry = this.findFirstGmlEntry(doc);
        if (!entry) throw new Error('No GML geometry found');
        return this.parseElement(entry.key, entry.value, version);
    }

    private parseElement(key: string, value: any, version: GmlVersion): GmlGeometry | GmlFeature | GmlFeatureCollection {
        const element = this.normalizeElement(value);
        const name = this.getLocalName(key, element);

        switch (name) {
            case 'featureMember':
                return this.parseFeatureMember(element, version);
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
            case 'RectifiedGridCoverage':
            case 'GMLJP2RectifiedGridCoverage':
                return this.parseRectifiedGridCoverage(element, version) as any;
            case 'GridCoverage':
                return this.parseGridCoverage(element, version) as any;
            case 'ReferenceableGridCoverage':
                return this.parseReferenceableGridCoverage(element, version) as any;
            case 'MultiPointCoverage':
                return this.parseMultiPointCoverage(element, version) as any;
            default:
                throw new Error(`Unsupported GML element: ${name}`);
        }
    }

    private parsePoint(element: any, version: GmlVersion): GmlPoint {
        const srsName = element.$?.srsName;
        const srsDimension = this.parseDimension(element.$?.srsDimension);
        const source = version === '2.1.2' ? this.getText(element['gml:coordinates']) : this.getText(element['gml:pos']);
        if (typeof source !== 'string') throw new Error('Invalid GML Point');
        const tuples = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension);
        const [coordinates] = tuples;
        if (!coordinates) throw new Error('Invalid GML Point');
        return { type: 'Point', coordinates, srsName, version };
    }

    private parseLineString(element: any, version: GmlVersion): GmlLineString {
        const srsName = element.$?.srsName;
        const srsDimension = this.parseDimension(element.$?.srsDimension);
        const source = version === '2.1.2' ? this.getText(element['gml:coordinates']) : this.getText(element['gml:posList']);
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
        const source = version === '2.1.2' ? this.getText(element['gml:coordinates']) : this.getText(element['gml:posList']);
        if (typeof source !== 'string') throw new Error('Invalid GML LinearRing');
        const coordinates = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension);
        return { type: 'LinearRing', coordinates, srsName, version };
    }

    private parseEnvelope(element: any, version: GmlVersion): GmlEnvelope {
        const lower = this.getText(element['gml:lowerCorner']);
        const upper = this.getText(element['gml:upperCorner']);
        if (typeof lower !== 'string' || typeof upper !== 'string') throw new Error('Invalid GML Envelope');
        const lowerVals = lower.trim().split(/\s+/).map(Number);
        const upperVals = upper.trim().split(/\s+/).map(Number);
        if (lowerVals.length < 2 || upperVals.length < 2) throw new Error('Invalid GML Envelope');
        const bbox: [number, number, number, number] = [lowerVals[0], lowerVals[1], upperVals[0], upperVals[1]];
        return { type: 'Envelope', bbox, srsName: element.$?.srsName, version };
    }

    private parseBox(element: any, version: GmlVersion): GmlBox {
        const coordinatesText = this.getText(element['gml:coordinates']);
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
            const source = this.getText(segment['gml:posList']) ?? this.getText(segment['gml:coordinates']);
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
            const source = this.getText(element['gml:coordinates']);
            if (typeof source !== 'string') throw new Error('Invalid GML MultiPoint');
            const coordinates = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension) as number[][];
            return { type: 'MultiPoint', coordinates, srsName, version };
        }

        const memberNodes = this.ensureArray(element['gml:pointMember']);
        const membersContainer = element['gml:pointMembers'];

        // Check if there are any member elements at all
        if (memberNodes.length === 0 && !membersContainer) {
            throw new Error('Invalid GML MultiPoint');
        }

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
            const source = this.getText(element['gml:coordinates']);
            if (typeof source !== 'string') throw new Error('Invalid GML MultiLineString');
            const lines = this.toCoordinateTuples(parseCoordinates(source, version, srsDimension), srsDimension) as number[][];
            return { type: 'MultiLineString', coordinates: [lines], srsName, version };
        }

        const lineStrings: number[][][] = [];
        const members = this.ensureArray(element['gml:lineStringMember']);
        const membersContainer = element['gml:lineStringMembers'];

        // Check if there are any member elements at all
        if (members.length === 0 && !membersContainer) {
            throw new Error('Invalid GML MultiLineString');
        }

        members.forEach(member => {
            const lineNode = this.normalizeElement(member['gml:LineString']);
            if (!lineNode) return;
            lineStrings.push(this.parseLineString(lineNode, version).coordinates);
        });

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

    private parseRectifiedGridCoverage(element: any, version: GmlVersion): GmlRectifiedGridCoverage {
        const id = element.$?.['gml:id'];

        // Parse boundedBy
        let boundedBy: GmlEnvelope | undefined;
        const boundedByNode = element['gml:boundedBy'];
        if (boundedByNode && !boundedByNode['gml:null']) {
            const envelopeNode = boundedByNode['gml:Envelope'] ?? boundedByNode;
            boundedBy = this.parseEnvelope(this.normalizeElement(envelopeNode), version);
        }

        // Parse domainSet (RectifiedGrid)
        const domainSetNode = element['gml:domainSet'] || element['gmlcov:domainSet'];
        if (!domainSetNode) throw new Error('Invalid RectifiedGridCoverage: missing domainSet');

        const rectifiedGridNode = domainSetNode['gml:RectifiedGrid'];
        if (!rectifiedGridNode) throw new Error('Invalid RectifiedGridCoverage: missing RectifiedGrid');

        const gridElement = this.normalizeElement(rectifiedGridNode);
        const dimension = parseInt(gridElement.$?.dimension, 10) || 2;
        const srsName = gridElement.$?.srsName;

        // Parse limits
        const limitsNode = gridElement['gml:limits'] || gridElement['gml:gridLimits'];
        const gridEnvelopeNode = limitsNode?.['gml:GridEnvelope'];
        if (!gridEnvelopeNode) throw new Error('Invalid RectifiedGridCoverage: missing GridEnvelope');

        const lowText = this.getText(gridEnvelopeNode['gml:low']);
        const highText = this.getText(gridEnvelopeNode['gml:high']);
        if (typeof lowText !== 'string' || typeof highText !== 'string') {
            throw new Error('Invalid GridEnvelope');
        }

        const low = lowText.trim().split(/\s+/).map(Number);
        const high = highText.trim().split(/\s+/).map(Number);

        // Parse axisLabels
        const axisLabelsText = this.getText(gridElement['gml:axisLabels']);
        const axisLabels = axisLabelsText?.trim().split(/\s+/);

        // Parse origin
        const originNode = gridElement['gml:origin'];
        const pointNode = originNode?.['gml:Point'];
        if (!pointNode) throw new Error('Invalid RectifiedGridCoverage: missing origin');

        const posText = this.getText(pointNode['gml:pos']);
        if (typeof posText !== 'string') throw new Error('Invalid origin Point');
        const origin = posText.trim().split(/\s+/).map(Number);

        // Parse offsetVectors
        const offsetVectorNodes = this.ensureArray(gridElement['gml:offsetVector']);
        const offsetVectors = offsetVectorNodes.map(node => {
            const text = this.getText(node);
            if (typeof text !== 'string') throw new Error('Invalid offsetVector');
            return text.trim().split(/\s+/).map(Number);
        });

        const domainSet = {
            id: gridElement.$?.['gml:id'],
            dimension,
            srsName,
            limits: { low, high },
            axisLabels,
            origin,
            offsetVectors,
        };

        // Parse rangeSet
        const rangeSetNode = element['gml:rangeSet'] || element['gmlcov:rangeSet'];
        const rangeSet: any = {};

        if (rangeSetNode) {
            const fileNode = rangeSetNode['gml:File'];
            if (fileNode) {
                const fileName = this.getText(fileNode['gml:fileName']);
                const fileStructure = this.getText(fileNode['gml:fileStructure']);
                if (fileName) {
                    rangeSet.file = {
                        fileName,
                        fileStructure: fileStructure || undefined,
                    };
                }
            }
        }

        // Parse rangeType (optional)
        const rangeTypeNode = element['gml:rangeType'] || element['gmlcov:rangeType'];
        let rangeType: any = undefined;
        if (rangeTypeNode) {
            const dataRecordNode = rangeTypeNode['swe:DataRecord'];
            if (dataRecordNode) {
                const fieldNodes = this.ensureArray(dataRecordNode['swe:field']);
                rangeType = {
                    field: fieldNodes.map(fieldNode => ({
                        name: fieldNode.$?.name,
                        dataType: this.getText(fieldNode['swe:Quantity']?.['swe:dataType']),
                        uom: fieldNode['swe:Quantity']?.$?.uom,
                        description: this.getText(fieldNode['swe:Quantity']?.['swe:description']),
                    })),
                };
            }
        }

        return {
            type: 'RectifiedGridCoverage',
            id,
            boundedBy,
            domainSet,
            rangeSet,
            rangeType,
            version,
        };
    }

    private parseGridCoverage(element: any, version: GmlVersion): GmlGridCoverage {
        const id = element.$?.['gml:id'];

        // Parse boundedBy
        let boundedBy: GmlEnvelope | undefined;
        const boundedByNode = element['gml:boundedBy'];
        if (boundedByNode && !boundedByNode['gml:null']) {
            const envelopeNode = boundedByNode['gml:Envelope'] ?? boundedByNode;
            boundedBy = this.parseEnvelope(this.normalizeElement(envelopeNode), version);
        }

        // Parse domainSet (Grid)
        const domainSetNode = element['gml:domainSet'] || element['gmlcov:domainSet'];
        if (!domainSetNode) throw new Error('Invalid GridCoverage: missing domainSet');

        const gridNode = domainSetNode['gml:Grid'];
        if (!gridNode) throw new Error('Invalid GridCoverage: missing Grid');

        const gridElement = this.normalizeElement(gridNode);
        const dimension = parseInt(gridElement.$?.dimension, 10) || 2;

        // Parse limits
        const limitsNode = gridElement['gml:limits'] || gridElement['gml:gridLimits'];
        const gridEnvelopeNode = limitsNode?.['gml:GridEnvelope'];
        if (!gridEnvelopeNode) throw new Error('Invalid GridCoverage: missing GridEnvelope');

        const lowText = this.getText(gridEnvelopeNode['gml:low']);
        const highText = this.getText(gridEnvelopeNode['gml:high']);
        if (typeof lowText !== 'string' || typeof highText !== 'string') {
            throw new Error('Invalid GridEnvelope');
        }

        const low = lowText.trim().split(/\s+/).map(Number);
        const high = highText.trim().split(/\s+/).map(Number);

        // Parse axisLabels
        const axisLabelsText = this.getText(gridElement['gml:axisLabels']);
        const axisLabels = axisLabelsText?.trim().split(/\s+/);

        const domainSet = {
            id: gridElement.$?.['gml:id'],
            dimension,
            limits: { low, high },
            axisLabels,
        };

        // Parse rangeSet
        const rangeSetNode = element['gml:rangeSet'] || element['gmlcov:rangeSet'];
        const rangeSet: any = {};

        if (rangeSetNode) {
            const fileNode = rangeSetNode['gml:File'];
            if (fileNode) {
                const fileName = this.getText(fileNode['gml:fileName']);
                const fileStructure = this.getText(fileNode['gml:fileStructure']);
                if (fileName) {
                    rangeSet.file = {
                        fileName,
                        fileStructure: fileStructure || undefined,
                    };
                }
            }
        }

        // Parse rangeType (optional)
        const rangeTypeNode = element['gml:rangeType'] || element['gmlcov:rangeType'];
        let rangeType: any = undefined;
        if (rangeTypeNode) {
            const dataRecordNode = rangeTypeNode['swe:DataRecord'];
            if (dataRecordNode) {
                const fieldNodes = this.ensureArray(dataRecordNode['swe:field']);
                rangeType = {
                    field: fieldNodes.map(fieldNode => ({
                        name: fieldNode.$?.name,
                        dataType: this.getText(fieldNode['swe:Quantity']?.['swe:dataType']),
                        uom: fieldNode['swe:Quantity']?.$?.uom,
                        description: this.getText(fieldNode['swe:Quantity']?.['swe:description']),
                    })),
                };
            }
        }

        return {
            type: 'GridCoverage',
            id,
            boundedBy,
            domainSet,
            rangeSet,
            rangeType,
            version,
        };
    }

    private parseReferenceableGridCoverage(element: any, version: GmlVersion): GmlReferenceableGridCoverage {
        // For now, parse similar to GridCoverage
        // A full implementation would parse additional georeferencing information
        const gridCoverage = this.parseGridCoverage(element, version);

        return {
            ...gridCoverage,
            type: 'ReferenceableGridCoverage',
        };
    }

    private parseMultiPointCoverage(element: any, version: GmlVersion): GmlMultiPointCoverage {
        const id = element.$?.['gml:id'];

        // Parse boundedBy
        let boundedBy: GmlEnvelope | undefined;
        const boundedByNode = element['gml:boundedBy'];
        if (boundedByNode && !boundedByNode['gml:null']) {
            const envelopeNode = boundedByNode['gml:Envelope'] ?? boundedByNode;
            boundedBy = this.parseEnvelope(this.normalizeElement(envelopeNode), version);
        }

        // Parse domainSet (MultiPoint)
        const domainSetNode = element['gml:domainSet'] || element['gmlcov:domainSet'];
        if (!domainSetNode) throw new Error('Invalid MultiPointCoverage: missing domainSet');

        const multiPointNode = domainSetNode['gml:MultiPoint'];
        if (!multiPointNode) throw new Error('Invalid MultiPointCoverage: missing MultiPoint');

        const domainSet = this.parseMultiPoint(this.normalizeElement(multiPointNode), version);

        // Parse rangeSet
        const rangeSetNode = element['gml:rangeSet'] || element['gmlcov:rangeSet'];
        const rangeSet: any = {};

        if (rangeSetNode) {
            const fileNode = rangeSetNode['gml:File'];
            if (fileNode) {
                const fileName = this.getText(fileNode['gml:fileName']);
                const fileStructure = this.getText(fileNode['gml:fileStructure']);
                if (fileName) {
                    rangeSet.file = {
                        fileName,
                        fileStructure: fileStructure || undefined,
                    };
                }
            }
        }

        // Parse rangeType (optional)
        const rangeTypeNode = element['gml:rangeType'] || element['gmlcov:rangeType'];
        let rangeType: any = undefined;
        if (rangeTypeNode) {
            const dataRecordNode = rangeTypeNode['swe:DataRecord'];
            if (dataRecordNode) {
                const fieldNodes = this.ensureArray(dataRecordNode['swe:field']);
                rangeType = {
                    field: fieldNodes.map(fieldNode => ({
                        name: fieldNode.$?.name,
                        dataType: this.getText(fieldNode['swe:Quantity']?.['swe:dataType']),
                        uom: fieldNode['swe:Quantity']?.$?.uom,
                        description: this.getText(fieldNode['swe:Quantity']?.['swe:description']),
                    })),
                };
            }
        }

        return {
            type: 'MultiPointCoverage',
            id,
            boundedBy,
            domainSet,
            rangeSet,
            rangeType,
            version,
        };
    }

    private parseFeatureCollection(element: any, version: GmlVersion): GmlFeatureCollection {
        const features: GmlFeature[] = [];

        // Support both gml:featureMember and wfs:member
        const featureMembers = this.ensureArray(element['gml:featureMember']);
        featureMembers.forEach(member => {
            features.push(this.parseFeatureMember(member, version));
        });

        const wfsMembers = this.ensureArray(element['wfs:member']);
        wfsMembers.forEach(member => {
            features.push(this.parseFeatureMember(member, version));
        });

        const featureMembersContainer = element['gml:featureMembers'];
        if (featureMembersContainer) {
            const containers = this.ensureArray(featureMembersContainer);
            containers.forEach(container => {
                for (const [key, value] of Object.entries(container)) {
                    // Skip GML namespace keys and internal metadata keys
                    if (key.startsWith('gml:') || key === '$' || key === '_' || key === '#name') continue;

                    // Handle array of features (common in gml:featureMembers)
                    const featureElements = this.ensureArray(value);
                    featureElements.forEach(featureElement => {
                        const feature = this.parseFeatureElement(key, featureElement as Record<string, any>, version);
                        features.push(feature);
                    });
                }
            });
        }

        const boundsNode = element['gml:boundedBy'];
        let bounds: GmlEnvelope | undefined;
        if (boundsNode && !boundsNode['gml:null']) {
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
            id: element.$?.['gml:id'] || element.$?.['fid'],
            geometry,
            properties,
            version,
        };

        const boundedByNode = element['gml:boundedBy'];
        if (boundedByNode && !boundedByNode['gml:null']) {
            const envelopeNode = boundedByNode['gml:Envelope'] ?? boundedByNode;
            feature.boundedBy = this.parseEnvelope(this.normalizeElement(envelopeNode), version);
        }

        return feature;
    }

    private extractPolygonCoordinates(element: any, version: GmlVersion, srsDimension: number): number[][][] {
        if (version === '2.1.2') {
            const outerText = this.getText(element['gml:outerBoundaryIs']?.['gml:LinearRing']?.['gml:coordinates']);
            if (typeof outerText !== 'string') throw new Error('Invalid GML Polygon');
            const exteriorRing = this.toCoordinateTuples(parseCoordinates(outerText, version, srsDimension), srsDimension);
            const innerBoundaries = this.ensureArray(element['gml:innerBoundaryIs']);
            const interiorRings = innerBoundaries.map(interior => {
                const text = this.getText(interior['gml:LinearRing']?.['gml:coordinates']);
                if (typeof text !== 'string') return [];
                return this.toCoordinateTuples(parseCoordinates(text, version, srsDimension), srsDimension);
            }).filter(ring => ring.length > 0);
            return [exteriorRing, ...interiorRings];
        }

        const exteriorText = this.getText(element['gml:exterior']?.['gml:LinearRing']?.['gml:posList']);
        if (typeof exteriorText !== 'string') throw new Error('Invalid GML Polygon');
        const exteriorRing = this.toCoordinateTuples(parseCoordinates(exteriorText, version, srsDimension), srsDimension);
        const interiors = this.ensureArray(element['gml:interior']);
        const interiorRings = interiors.map(interior => {
            const text = this.getText(interior['gml:LinearRing']?.['gml:posList']);
            if (typeof text !== 'string') return [];
            return this.toCoordinateTuples(parseCoordinates(text, version, srsDimension), srsDimension);
        }).filter(ring => ring.length > 0);
        return [exteriorRing, ...interiorRings];
    }

    private toGeoJson(gmlObject: GmlGeometry | GmlFeature | GmlFeatureCollection | GmlCoverage): Geometry | Feature | FeatureCollection {
        if (this.isFeatureCollection(gmlObject)) {
            // Use builder for FeatureCollection
            return this.builder.buildFeatureCollection(gmlObject);
        }

        if (this.isFeature(gmlObject)) {
            // Use builder for Feature
            return this.builder.buildFeature(gmlObject);
        }

        if (this.isCoverage(gmlObject)) {
            return this.coverageToGeoJson(gmlObject);
        }

        return this.geometryToGeoJson(gmlObject);
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

    private findFirstGmlEntry(node: any): { key: string; value: any } | undefined {
        if (!node || typeof node !== 'object') return undefined;

        for (const [key, value] of Object.entries(node)) {
            if (key === '$' || key === '_') continue;
            if (key.startsWith('gml:')) {
                return { key, value };
            }
        }

        for (const [key, value] of Object.entries(node)) {
            if (key === '$' || key === '_') continue;
            if (!value) continue;
            if (Array.isArray(value)) {
                for (const item of value) {
                    const result = this.findFirstGmlEntry(item);
                    if (result) return result;
                }
            } else if (typeof value === 'object') {
                const result = this.findFirstGmlEntry(value);
                if (result) return result;
            }
        }

        return undefined;
    }

    private findFeatureCollectionNode(node: any): any | undefined {
        if (!node || typeof node !== 'object') return undefined;

        for (const [key, value] of Object.entries(node)) {
            if (key === '$' || key === '_') continue;
            if (key.endsWith('FeatureCollection')) {
                return this.normalizeElement(value);
            }
        }

        for (const [key, value] of Object.entries(node)) {
            if (key === '$' || key === '_') continue;
            if (!value) continue;
            if (Array.isArray(value)) {
                for (const item of value) {
                    const result = this.findFeatureCollectionNode(item);
                    if (result) return result;
                }
            } else if (typeof value === 'object') {
                const result = this.findFeatureCollectionNode(value);
                if (result) return result;
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

        if (featurePropertyKey && featurePropertyKey.startsWith('gml:')) {
            const name = this.getLocalName(featurePropertyKey, node);
            if (GEOMETRY_ELEMENT_NAMES.has(name)) {
                return { key: featurePropertyKey, value: node, featurePropertyKey };
            }
        }

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
            if (key === '$' || key === '#name' || key === '_') continue;
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

        const text = this.getText(value);
        if (text !== undefined) {
            return text.trim();
        }

        if (typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, val]) => [key, this.normalizePropertyValue(val)])
            );
        }

        if (typeof value === 'string') {
            return value.trim();
        }

        return value;
    }

    private getText(value: any): string | undefined {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) {
            for (const item of value) {
                const result = this.getText(item);
                if (result !== undefined) return result;
            }
            return undefined;
        }
        if (typeof value === 'object') {
            if (typeof value._ === 'string') return value._;
        }
        return undefined;
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

    private isFeatureCollection(value: GmlGeometry | GmlFeature | GmlFeatureCollection | GmlCoverage): value is GmlFeatureCollection {
        return (value as GmlFeatureCollection).type === 'FeatureCollection';
    }

    private isFeature(value: GmlGeometry | GmlFeature | GmlFeatureCollection | GmlCoverage): value is GmlFeature {
        return (value as GmlFeature).geometry !== undefined && (value as GmlFeature).properties !== undefined;
    }

    private isCoverage(value: any): value is GmlCoverage {
        const type = (value as GmlCoverage).type;
        return type === 'RectifiedGridCoverage' || type === 'GridCoverage' || type === 'ReferenceableGridCoverage' || type === 'MultiPointCoverage';
    }

    private coverageToGeoJson(coverage: GmlCoverage): Feature {
        switch (coverage.type) {
            case 'RectifiedGridCoverage':
                return this.builder.buildRectifiedGridCoverage(coverage);
            case 'GridCoverage':
                return this.builder.buildGridCoverage(coverage);
            case 'ReferenceableGridCoverage':
                return this.builder.buildReferenceableGridCoverage(coverage);
            case 'MultiPointCoverage':
                return this.builder.buildMultiPointCoverage(coverage);
            default:
                throw new Error(`Unsupported coverage type: ${(coverage as any).type}`);
        }
    }
}
