import { parseXml, detectGmlVersion, parseCoordinates } from './utils.js';
import { GmlGeometry, GmlVersion, GmlFeature, GmlFeatureCollection, GmlPolygon, Geometry, Feature, FeatureCollection, GmlConvertOptions, Builder } from './types.js';
import { getBuilder } from './builders/index.js';
import { generateGml } from './generator.js';

export class GmlParser {
    private builder: Builder;

    constructor(targetFormat: string = 'geojson') {
        this.builder = getBuilder(targetFormat);
    }

    async parse(xml: string): Promise<Geometry | Feature | FeatureCollection> {
        const doc = await parseXml(xml);
        const version = detectGmlVersion(doc);
        return this.parseDocument(doc, version);
    }

    private parseDocument(doc: any, version: GmlVersion): any {
        const gmlKey = Object.keys(doc).find(key => key.startsWith('gml:'));
        if (!gmlKey) throw new Error('No GML geometry found');

        const element = doc[gmlKey];
        switch (element['#name']) {
            case 'Point': return this.parsePoint(element, version);
            case 'LineString': return this.parseLineString(element, version);
            case 'Polygon': return this.parsePolygon(element, version);
            case 'LinearRing': return this.parseLinearRing(element, version);
            case 'Envelope': return this.parseEnvelope(element, version);
            case 'Box': return this.parseBox(element, version);
            case 'Curve': return this.parseCurve(element, version);
            case 'Surface': return this.parseSurface(element, version);
            case 'MultiPoint': return this.parseMultiPoint(element, version);
            case 'MultiLineString': return this.parseMultiLineString(element, version);
            case 'MultiPolygon': return this.parseMultiPolygon(element, version);
            case 'FeatureCollection': return this.parseFeatureCollection(element, version);
            default: throw new Error(`Unsupported GML geometry: ${element['#name']}`);
        }
    }

    private parseLinearRing(element: any, version: GmlVersion): Geometry {
        const srsName = element.$?.srsName;
        const srsDimension = parseInt(element.$?.srsDimension) || 2;
        const coordinatesSource = version === '2.1.2'
            ? element['gml:coordinates']?._
            : element['gml:posList']?._;
        if (typeof coordinatesSource !== 'string') throw new Error('Invalid GML LinearRing');
        const coordinates = this.toCoordinateTuples(parseCoordinates(coordinatesSource, version, srsDimension), srsDimension);
        return this.builder.buildLinearRing({
            type: 'LinearRing',
            coordinates,
            srsName,
            version,
        });
    }

    private parseEnvelope(element: any, version: GmlVersion): Feature {
        const lowerCorner = element['gml:lowerCorner']?._.trim().split(' ');
        const upperCorner = element['gml:upperCorner']?._.trim().split(' ');
        if (!lowerCorner || !upperCorner) throw new Error('Invalid GML Envelope');

        const [minX, minY] = lowerCorner.map(Number);
        const [maxX, maxY] = upperCorner.map(Number);

        return this.builder.buildEnvelope({
            type: 'Envelope',
            bbox: [minX, minY, maxX, maxY],
            srsName: element.$?.srsName,
            version,
        });
    }

    private parseBox(element: any, version: GmlVersion): Feature {
        const coordinates = element['gml:coordinates']?._.trim().split(' ');
        if (!coordinates) throw new Error('Invalid GML Box');

        const [minX, minY, maxX, maxY] = coordinates.map(Number);
        return this.builder.buildBox({
            type: 'Box',
            coordinates: [minX, minY, maxX, maxY],
            srsName: element.$?.srsName,
            version,
        });
    }

    private parseCurve(element: any, version: GmlVersion): Geometry {
        const rawSegments = element['gml:segments']?.['gml:LineStringSegment'];
        const segments = this.ensureArray(rawSegments);
        if (!segments.length) throw new Error('Invalid GML Curve');

        const coordinates = segments.map((segment: any) => {
            const posListText = segment['gml:posList']?._ ?? segment['gml:coordinates']?._;
            if (typeof posListText !== 'string') throw new Error('Invalid GML LineStringSegment');
            const srsDimension = parseInt(segment.$?.srsDimension) || parseInt(element.$?.srsDimension) || 2;
            return this.toCoordinateTuples(parseCoordinates(posListText, version, srsDimension), srsDimension);
        }).flat();

        return this.builder.buildCurve({
            type: 'Curve',
            coordinates,
            srsName: element.$?.srsName,
            version,
        });
    }

    private parseSurface(element: any, version: GmlVersion): Geometry {
        const rawPatches = element['gml:patches']?.['gml:PolygonPatch'];
        const patches = this.ensureArray(rawPatches);
        if (!patches.length) throw new Error('Invalid GML Surface');

        const polygons: GmlPolygon[] = patches.map((patch: any) => {
            const srsDimension = parseInt(patch.$?.srsDimension) || parseInt(element.$?.srsDimension) || 2;
            const coordinates = this.extractPolygonCoordinates(patch, version, srsDimension);
            return {
                type: 'Polygon' as const,
                coordinates,
                srsName: patch.$?.srsName ?? element.$?.srsName,
                version,
            };
        });

        return this.builder.buildSurface({
            type: 'Surface',
            patches: polygons,
            srsName: element.$?.srsName,
            version,
        });
    }

    private parsePoint(element: any, version: GmlVersion): Geometry {
        const srsName = element.$?.srsName;
        const srsDimension = parseInt(element.$?.srsDimension) || 2;
        const coordinateSource = version === '2.1.2'
            ? element['gml:coordinates']?._
            : element['gml:pos']?._;
        if (typeof coordinateSource !== 'string') throw new Error('Invalid GML Point');
        const tuples = this.toCoordinateTuples(parseCoordinates(coordinateSource, version, srsDimension), srsDimension);
        const [coordinates] = tuples;
        if (!coordinates) throw new Error('Invalid GML Point');
        return this.builder.buildPoint({ type: 'Point', coordinates, srsName, version });
    }

    private parseLineString(element: any, version: GmlVersion): Geometry {
        const srsName = element.$?.srsName;
        const srsDimension = parseInt(element.$?.srsDimension) || 2;
        const coordinatesSource = version === '2.1.2'
            ? element['gml:coordinates']?._
            : element['gml:posList']?._;
        if (typeof coordinatesSource !== 'string') throw new Error('Invalid GML LineString');
        const coordinates = this.toCoordinateTuples(parseCoordinates(coordinatesSource, version, srsDimension), srsDimension);
        return this.builder.buildLineString({ type: 'LineString', coordinates, srsName, version });
    }

    private parsePolygon(element: any, version: GmlVersion): Geometry {
        const srsName = element.$?.srsName;
        const srsDimension = parseInt(element.$?.srsDimension) || 2;
        const coordinates = this.extractPolygonCoordinates(element, version, srsDimension);
        return this.builder.buildPolygon({ type: 'Polygon', coordinates, srsName, version });
    }

    private parseMultiPoint(element: any, version: GmlVersion): Geometry {
        const srsName = element.$?.srsName;
        const srsDimension = parseInt(element.$?.srsDimension) || 2;
        const coordinates = version === '2.1.2'
            ? parseCoordinates(element['gml:coordinates']?._, version, srsDimension) as number[][]
            : (element['gml:pointMember'] || []).map((point: any) =>
                (parseCoordinates(point['gml:Point']['gml:pos']?._, version, srsDimension) as number[]));
        return this.builder.buildMultiPoint({ type: 'MultiPoint', coordinates, srsName, version });
    }

    private parseMultiLineString(element: any, version: GmlVersion): Geometry {
        const srsName = element.$?.srsName;
        const srsDimension = parseInt(element.$?.srsDimension) || 2;
        const coordinates = version === '2.1.2'
            ? [parseCoordinates(element['gml:coordinates']?._, version, srsDimension) as number[][]]
            : (element['gml:lineStringMember'] || []).map((line: any) =>
                parseCoordinates(line['gml:LineString']['gml:posList']?._, version, srsDimension) as number[][]);
        return this.builder.buildMultiLineString({ type: 'MultiLineString', coordinates, srsName, version });
    }

    private parseMultiPolygon(element: any, version: GmlVersion): Geometry {
        const srsName = element.$?.srsName;
        const srsDimension = parseInt(element.$?.srsDimension) || 2;
        const polygonMembers = this.ensureArray(element['gml:polygonMember']).map((member: any) => member?.['gml:Polygon']).filter(Boolean);
        const polygonMembersNested = this.ensureArray(element['gml:polygonMembers']?.['gml:Polygon']);
        const polygons = [...polygonMembers, ...polygonMembersNested];
        if (!polygons.length) throw new Error('Invalid GML MultiPolygon');

        const coordinates = polygons.map((polygon: any) => {
            const polygonSrsDimension = parseInt(polygon.$?.srsDimension) || srsDimension;
            return this.extractPolygonCoordinates(polygon, version, polygonSrsDimension);
        });
        return this.builder.buildMultiPolygon({ type: 'MultiPolygon', coordinates, srsName, version });
    }

    private parseFeatureCollection(element: any, version: GmlVersion): FeatureCollection {
        const members = this.ensureArray(element['gml:featureMember']);
        const features = members.map((member: any) => {
            const memberKey = Object.keys(member)[0];
            const featureElement = memberKey ? (member[memberKey] as Record<string, any>) : undefined;
            if (!featureElement) throw new Error('Invalid GML feature member');

            const geometryValue = this.ensureGeometry(
                this.parseDocument({ [memberKey]: featureElement }, version)
            );

            const properties = this.extractFeatureProperties(featureElement);

            const feature: Feature = {
                type: 'Feature',
                geometry: geometryValue,
                properties,
            };

            const featureId = featureElement.$?.['gml:id'];
            if (featureId !== undefined) {
                feature.id = featureId;
            }

            return feature;
        });

        const collection: FeatureCollection = {
            type: 'FeatureCollection',
            features,
        };

        return collection;
    }

    private ensureGeometry(value: Geometry | Feature | FeatureCollection): Geometry {
        if ((value as Feature)?.type === 'Feature') {
            return (value as Feature).geometry as Geometry;
        }
        if ((value as FeatureCollection)?.type === 'FeatureCollection') {
            throw new Error('Expected a geometry but received a FeatureCollection');
        }
        return value as Geometry;
    }

    private extractFeatureProperties(featureElement: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        if (featureElement.$) {
            for (const [key, value] of Object.entries(featureElement.$)) {
                if (key !== 'gml:id') {
                    result[key] = value;
                }
            }
        }

        for (const [key, value] of Object.entries(featureElement)) {
            if (key === '$' || key === '#name' || key === 'gml:id') continue;
            if (key.startsWith('gml:')) continue;
            result[key] = value;
        }

        return result;
    }

    private extractPolygonCoordinates(element: any, version: GmlVersion, srsDimension: number): number[][][] {
        if (version === '2.1.2') {
            const exteriorText = element['gml:outerBoundaryIs']?.['gml:LinearRing']?.['gml:coordinates']?._;
            if (typeof exteriorText !== 'string') throw new Error('Invalid GML Polygon');
            const exteriorRing = this.toCoordinateTuples(parseCoordinates(exteriorText, version, srsDimension), srsDimension);
            const innerBoundaries = this.ensureArray(element['gml:innerBoundaryIs']);
            const interiorRings = innerBoundaries.map((interior: any) => {
                const interiorText = interior['gml:LinearRing']?.['gml:coordinates']?._;
                if (typeof interiorText !== 'string') return [];
                return this.toCoordinateTuples(parseCoordinates(interiorText, version, srsDimension), srsDimension);
            }).filter((ring: number[][]) => ring.length > 0);
            return [exteriorRing, ...interiorRings];
        }

        const exteriorText = element['gml:exterior']?.['gml:LinearRing']?.['gml:posList']?._;
        if (typeof exteriorText !== 'string') throw new Error('Invalid GML Polygon');
        const exteriorRing = this.toCoordinateTuples(parseCoordinates(exteriorText, version, srsDimension), srsDimension);
        const interiors = this.ensureArray(element['gml:interior']);
        const interiorRings = interiors.map((interior: any) => {
            const interiorText = interior['gml:LinearRing']?.['gml:posList']?._;
            if (typeof interiorText !== 'string') return [];
            return this.toCoordinateTuples(parseCoordinates(interiorText, version, srsDimension), srsDimension);
        }).filter((ring: number[][]) => ring.length > 0);
        return [exteriorRing, ...interiorRings];
    }

    private ensureArray<T>(value: T | T[] | undefined): T[] {
        if (value === undefined || value === null) return [];
        return Array.isArray(value) ? value : [value];
    }

    private toCoordinateTuples(coords: number[] | number[][], dimension: number): number[][] {
        if (!coords.length) return [];
        if (Array.isArray(coords[0])) {
            return coords as number[][];
        }

        const flat = coords as number[];
        const tuples: number[][] = [];
        for (let i = 0; i < flat.length; i += dimension) {
            tuples.push(flat.slice(i, i + dimension));
        }
        return tuples;
    }

    async convert(xml: string, options: GmlConvertOptions): Promise<string> {
        const { outputVersion, prettyPrint = false } = options;
        const doc = await parseXml(xml);
        const inputVersion = options.inputVersion || detectGmlVersion(doc);
        const gmlObject = this.parseDocument(doc, inputVersion);
        return generateGml(gmlObject, outputVersion, prettyPrint);
    }

    async convertGeometry(gmlObject: GmlGeometry | GmlFeature | GmlFeatureCollection, options: Pick<GmlConvertOptions, 'outputVersion' | 'prettyPrint'>): Promise<string> {
        return generateGml(gmlObject, options.outputVersion, options.prettyPrint);
    }
}
