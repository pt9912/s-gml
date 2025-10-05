import type {
    GmlGeometry,
    GmlFeature,
    GmlFeatureCollection,
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
    GmlOutputVersion,
} from './types.js';

export function generateGml(
    gmlObject: GmlGeometry | GmlFeature | GmlFeatureCollection,
    outputVersion: GmlOutputVersion,
    prettyPrint: boolean = false
): string {
    if (isGmlFeatureCollection(gmlObject)) {
        return generateFeatureCollection(gmlObject, outputVersion, prettyPrint);
    }

    if (isGmlFeature(gmlObject)) {
        return generateFeature(gmlObject, outputVersion, prettyPrint);
    }

    return generateGeometry(gmlObject, outputVersion, prettyPrint);
}

function generateGeometry(
    geometry: GmlGeometry,
    outputVersion: GmlOutputVersion,
    prettyPrint: boolean
): string {
    switch (geometry.type) {
        case 'Point':
            return generatePoint(geometry, outputVersion, prettyPrint);
        case 'LineString':
            return generateLineString(geometry, outputVersion, prettyPrint);
        case 'Polygon':
            return generatePolygon(geometry, outputVersion, prettyPrint);
        case 'LinearRing':
            return generateLinearRing(geometry, outputVersion, prettyPrint);
        case 'Envelope':
            return generateEnvelope(geometry, outputVersion, prettyPrint);
        case 'Box':
            return generateBox(geometry, outputVersion, prettyPrint);
        case 'Curve':
            return generateCurve(geometry, outputVersion, prettyPrint);
        case 'Surface':
            return generateSurface(geometry, outputVersion, prettyPrint);
        case 'MultiPoint':
            return generateMultiPoint(geometry, outputVersion, prettyPrint);
        case 'MultiLineString':
            return generateMultiLineString(geometry, outputVersion, prettyPrint);
        case 'MultiPolygon':
            return generateMultiPolygon(geometry, outputVersion, prettyPrint);
        default:
            throw new Error('Unsupported GML type for conversion.');
    }
}

function generateFeature(
    feature: GmlFeature,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const idAttr = feature.id ? ` gml:id="${feature.id}"` : '';

    xml.push(0, '<gml:featureMember>');
    xml.push(1, `<gml:Feature${idAttr} ${namespace}>`);

    if (feature.boundedBy) {
        xml.push(2, '<gml:boundedBy>');
        appendXml(xml, generateEnvelope(feature.boundedBy, version, prettyPrint), 3);
        xml.push(2, '</gml:boundedBy>');
    }

    for (const [key, value] of Object.entries(feature.properties ?? {})) {
        xml.push(2, `<${key}>${serializePropertyValue(value)}</${key}>`);
    }

    xml.push(1, '<gml:geometry>');
    appendXml(xml, generateGeometry(feature.geometry, version, prettyPrint), 2);
    xml.push(1, '</gml:geometry>');
    xml.push(1, '</gml:Feature>');
    xml.push(0, '</gml:featureMember>');

    return xml.toString();
}

function generateFeatureCollection(
    featureCollection: GmlFeatureCollection,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);

    xml.push(0, `<gml:FeatureCollection ${namespace}>`);

    if (featureCollection.bounds) {
        xml.push(1, '<gml:boundedBy>');
        appendXml(xml, generateEnvelope(featureCollection.bounds, version, prettyPrint), 2);
        xml.push(1, '</gml:boundedBy>');
    }

    for (const feature of featureCollection.features) {
        appendXml(xml, generateFeature(feature, version, prettyPrint), 1);
    }
    xml.push(0, '</gml:FeatureCollection>');

    return xml.toString();
}

function generatePoint(point: GmlPoint, version: GmlOutputVersion, prettyPrint: boolean): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = point.srsName ? ` srsName="${point.srsName}"` : '';
    const coords = formatCoordinateList([point.coordinates], version);
    const tag = version === '2.1.2' ? 'coordinates' : 'pos';

    xml.push(0, `<gml:Point${srsAttr} ${namespace}>`);
    xml.push(1, `<gml:${tag}>${coords}</gml:${tag}>`);
    xml.push(0, '</gml:Point>');

    return xml.toString();
}

function generateLineString(
    lineString: GmlLineString,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = lineString.srsName ? ` srsName="${lineString.srsName}"` : '';
    const coords = formatCoordinateList(lineString.coordinates, version);
    const tag = version === '2.1.2' ? 'coordinates' : 'posList';

    xml.push(0, `<gml:LineString${srsAttr} ${namespace}>`);
    xml.push(1, `<gml:${tag}>${coords}</gml:${tag}>`);
    xml.push(0, '</gml:LineString>');

    return xml.toString();
}

function generateLinearRing(
    linearRing: GmlLinearRing,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = linearRing.srsName ? ` srsName="${linearRing.srsName}"` : '';
    const coords = formatCoordinateList(linearRing.coordinates, version);
    const tag = version === '2.1.2' ? 'coordinates' : 'posList';

    xml.push(0, `<gml:LinearRing${srsAttr} ${namespace}>`);
    xml.push(1, `<gml:${tag}>${coords}</gml:${tag}>`);
    xml.push(0, '</gml:LinearRing>');

    return xml.toString();
}

function generatePolygon(
    polygon: GmlPolygon,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = polygon.srsName ? ` srsName="${polygon.srsName}"` : '';
    const exteriorTag = version === '2.1.2' ? 'outerBoundaryIs' : 'exterior';
    const interiorTag = version === '2.1.2' ? 'innerBoundaryIs' : 'interior';
    const ringTag = version === '2.1.2' ? 'coordinates' : 'posList';
    const [exterior, ...interiors] = polygon.coordinates;
    if (!exterior) {
        throw new Error('Invalid polygon: missing exterior ring');
    }

    xml.push(0, `<gml:Polygon${srsAttr} ${namespace}>`);
    xml.push(1, `<gml:${exteriorTag}>`);
    xml.push(2, '<gml:LinearRing>');
    xml.push(3, `<gml:${ringTag}>${formatCoordinateList(exterior, version)}</gml:${ringTag}>`);
    xml.push(2, '</gml:LinearRing>');
    xml.push(1, `</gml:${exteriorTag}>`);

    for (const ring of interiors) {
        xml.push(1, `<gml:${interiorTag}>`);
        xml.push(2, '<gml:LinearRing>');
        xml.push(3, `<gml:${ringTag}>${formatCoordinateList(ring, version)}</gml:${ringTag}>`);
        xml.push(2, '</gml:LinearRing>');
        xml.push(1, `</gml:${interiorTag}>`);
    }

    xml.push(0, '</gml:Polygon>');

    return xml.toString();
}

function generateEnvelope(
    envelope: GmlEnvelope,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = envelope.srsName ? ` srsName="${envelope.srsName}"` : '';
    const [minX, minY, maxX, maxY] = envelope.bbox;

    xml.push(0, `<gml:Envelope${srsAttr} ${namespace}>`);
    xml.push(1, `<gml:lowerCorner>${minX} ${minY}</gml:lowerCorner>`);
    xml.push(1, `<gml:upperCorner>${maxX} ${maxY}</gml:upperCorner>`);
    xml.push(0, '</gml:Envelope>');

    return xml.toString();
}

function generateBox(box: GmlBox, version: GmlOutputVersion, prettyPrint: boolean): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = box.srsName ? ` srsName="${box.srsName}"` : '';
    const [minX, minY, maxX, maxY] = box.coordinates;
    const coordText = version === '2.1.2'
        ? `${minX},${minY} ${maxX},${maxY}`
        : `${minX} ${minY} ${maxX} ${maxY}`;

    xml.push(0, `<gml:Box${srsAttr} ${namespace}>`);
    xml.push(1, `<gml:coordinates>${coordText}</gml:coordinates>`);
    xml.push(0, '</gml:Box>');

    return xml.toString();
}

function generateCurve(curve: GmlCurve, version: GmlOutputVersion, prettyPrint: boolean): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = curve.srsName ? ` srsName="${curve.srsName}"` : '';
    const tag = version === '2.1.2' ? 'coordinates' : 'posList';
    const coords = formatCoordinateList(curve.coordinates, version);

    xml.push(0, `<gml:Curve${srsAttr} ${namespace}>`);
    xml.push(1, '<gml:segments>');
    xml.push(2, '<gml:LineStringSegment>');
    xml.push(3, `<gml:${tag}>${coords}</gml:${tag}>`);
    xml.push(2, '</gml:LineStringSegment>');
    xml.push(1, '</gml:segments>');
    xml.push(0, '</gml:Curve>');

    return xml.toString();
}

function generateSurface(surface: GmlSurface, version: GmlOutputVersion, prettyPrint: boolean): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const srsAttr = surface.srsName ? ` srsName="${surface.srsName}"` : '';

    xml.push(0, `<gml:Surface${srsAttr} ${namespace}>`);
    xml.push(1, '<gml:patches>');
    for (const patch of surface.patches) {
        xml.push(2, '<gml:PolygonPatch>');
        appendXml(xml, generatePolygon(patch, version, prettyPrint), 3);
        xml.push(2, '</gml:PolygonPatch>');
    }
    xml.push(1, '</gml:patches>');
    xml.push(0, '</gml:Surface>');

    return xml.toString();
}

function generateMultiPoint(
    multiPoint: GmlMultiPoint,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);

    xml.push(0, `<gml:MultiPoint ${namespace}>`);
    for (const coords of multiPoint.coordinates) {
        xml.push(1, '<gml:pointMember>');
        const point: GmlPoint = {
            type: 'Point',
            coordinates: coords,
            srsName: multiPoint.srsName,
            version: multiPoint.version,
        };
        appendXml(xml, generatePoint(point, version, prettyPrint), 2);
        xml.push(1, '</gml:pointMember>');
    }
    xml.push(0, '</gml:MultiPoint>');

    return xml.toString();
}

function generateMultiLineString(
    multiLineString: GmlMultiLineString,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);
    const tag = version === '2.1.2' ? 'coordinates' : 'posList';

    xml.push(0, `<gml:MultiLineString ${namespace}>`);
    for (const line of multiLineString.coordinates) {
        xml.push(1, '<gml:lineStringMember>');
        xml.push(2, '<gml:LineString>');
        xml.push(3, `<gml:${tag}>${formatCoordinateList(line, version)}</gml:${tag}>`);
        xml.push(2, '</gml:LineString>');
        xml.push(1, '</gml:lineStringMember>');
    }
    xml.push(0, '</gml:MultiLineString>');

    return xml.toString();
}

function generateMultiPolygon(
    multiPolygon: GmlMultiPolygon,
    version: GmlOutputVersion,
    prettyPrint: boolean
): string {
    const xml = createXmlBuilder(prettyPrint);
    const namespace = getNamespace(version);

    xml.push(0, `<gml:MultiPolygon ${namespace}>`);
    for (const polygonCoords of multiPolygon.coordinates) {
        xml.push(1, '<gml:polygonMember>');
        const polygon: GmlPolygon = {
            type: 'Polygon',
            coordinates: polygonCoords,
            srsName: multiPolygon.srsName,
            version: multiPolygon.version,
        };
        appendXml(xml, generatePolygon(polygon, version, prettyPrint), 2);
        xml.push(1, '</gml:polygonMember>');
    }
    xml.push(0, '</gml:MultiPolygon>');

    return xml.toString();
}

function createXmlBuilder(prettyPrint: boolean) {
    const indentUnit = prettyPrint ? '  ' : '';
    const newline = prettyPrint ? '\n' : '';
    const lines: string[] = [];

    return {
        push(level: number, text: string) {
            lines.push(`${indentUnit.repeat(level)}${text}`);
        },
        toString(): string {
            return lines.join(newline);
        },
        get newline(): string {
            return newline;
        },
    };
}

type XmlBuilder = ReturnType<typeof createXmlBuilder>;

function appendXml(target: XmlBuilder, xml: string, level: number): void {
    const lines = xml.split(/\r?\n/);
    for (const line of lines) {
        target.push(level, line);
    }
}

function formatCoordinateList(coordinates: number[][], version: GmlOutputVersion): string {
    const pairSeparator = version === '2.1.2' ? ',' : ' ';
    return coordinates
        .map(tuple => tuple.join(pairSeparator))
        .join(' ');
}

function serializePropertyValue(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function getNamespace(version: GmlOutputVersion): string {
    return version === '2.1.2'
        ? 'xmlns:gml="http://www.opengis.net/gml"'
        : 'xmlns:gml="http://www.opengis.net/gml/3.2"';
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isGmlFeatureCollection(value: GmlGeometry | GmlFeature | GmlFeatureCollection): value is GmlFeatureCollection {
    return isObject(value) && (value as GmlFeatureCollection).type === 'FeatureCollection';
}

function isGmlFeature(value: GmlGeometry | GmlFeature | GmlFeatureCollection): value is GmlFeature {
    return isObject(value) && 'geometry' in value && 'properties' in value;
}
