import { parseStringPromise } from 'xml2js';
import { GmlVersion } from './types.js';

export async function parseXml(xml: string): Promise<any> {
    return parseStringPromise(xml, {
        explicitArray: false,
        ignoreAttrs: false,
        charkey: '_',
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
