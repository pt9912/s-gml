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
    const ns = Object.keys(doc).find(key => key.startsWith('gml:'))?.split(':')[1];
    if (!ns) throw new Error('No GML namespace found');

    const xmlns = doc[`gml:${ns}`]?.$?.['xmlns:gml'];
    if (xmlns?.includes('3.2')) return '3.2';
    if (xmlns?.includes('3.1')) return '3.1';
    if (xmlns?.includes('3.0')) return '3.0';
    if (xmlns === 'http://www.opengis.net/gml') return '2.1.2';
    return '3.2';
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
