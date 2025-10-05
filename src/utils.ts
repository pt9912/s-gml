import { XMLParser } from 'fast-xml-parser';
import { GmlVersion } from './types.js';
import { isOwsExceptionReport, throwOwsException } from './ows-exception.js';

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    attributesGroupName: '$',
    textNodeName: '_',
    trimValues: false,
    allowBooleanAttributes: true,
    parseAttributeValue: false,
    parseTagValue: false,
    removeNSPrefix: false,
});

export async function parseXml(xml: string): Promise<any> {
    // Check if this is an OWS Exception Report before parsing
    if (isOwsExceptionReport(xml)) {
        throwOwsException(xml);
    }

    const parsed = xmlParser.parse(xml);
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid XML: parsing failed');
    }

    annotateLocalNames(parsed);
    return parsed;
}

function annotateLocalNames(node: any, key?: string): void {
    if (Array.isArray(node)) {
        for (const item of node) {
            annotateLocalNames(item, key);
        }
        return;
    }

    if (!node || typeof node !== 'object') return;

    if (key) {
        defineLocalName(node, key);
    }

    for (const [childKey, childValue] of Object.entries(node)) {
        if (childKey === '$' || childKey === '_' || childKey === '#name') continue;
        annotateLocalNames(childValue, childKey);
    }
}

function defineLocalName(target: Record<string, any>, qualifiedName: string): void {
    const parts = qualifiedName.split(':');
    const localName = parts[parts.length - 1];
    Object.defineProperty(target, '#name', {
        value: localName,
        enumerable: false,
        writable: true,
        configurable: true,
    });
}

export function detectGmlVersion(doc: any): GmlVersion {
    const namespace = findGmlNamespace(doc);
    if (!namespace) throw new Error('No GML namespace found');

    if (namespace.includes('3.2')) return '3.2';
    if (namespace.includes('3.1')) return '3.1';
    if (namespace.includes('3.0')) return '3.0';
    if (namespace === 'http://www.opengis.net/gml') return '2.1.2';
    return '3.2';
}

function findGmlNamespace(node: any): string | undefined {
    if (!node || typeof node !== 'object') return undefined;

    if (node.$ && typeof node.$['xmlns:gml'] === 'string') {
        return node.$['xmlns:gml'];
    }

    for (const [key, value] of Object.entries(node)) {
        if (key === '$' || key === '_') continue;

        if (key.startsWith('xmlns:') && key.endsWith('gml') && typeof value === 'string') {
            return value;
        }

        const child = value;
        if (Array.isArray(child)) {
            for (const item of child) {
                const result = findGmlNamespace(item);
                if (result) return result;
            }
        } else if (typeof child === 'object') {
            const result = findGmlNamespace(child);
            if (result) return result;
        }
    }

    return undefined;
}

export function parseCoordinates(
    coords: string,
    version: GmlVersion,
    srsDimension: number = 2
): number[] | number[][] {
    if (version === '2.1.2') {
        return coords.trim().split(' ').map(point => point.split(',').map(Number));
    } else {
        const flatCoords = coords.trim().split(' ').map(Number);
        const result: number[][] = [];
        for (let i = 0; i < flatCoords.length; i += srsDimension) {
            result.push(flatCoords.slice(i, i + srsDimension));
        }
        return srsDimension > 2 ? result : result.flat();
    }
}
