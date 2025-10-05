import { validateXML } from 'xmllint-wasm';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';

const GML_XSD_URLS: Record<string, string> = {
    '2.1.2': 'http://schemas.opengis.net/gml/2.1.2/feature.xsd',
    '3.2': 'http://schemas.opengis.net/gml/3.2.1/gml.xsd',
};

type XsdFetcher = (url: string) => Promise<string>;

const xsdCache = new Map<string, string>();
let customFetcher: XsdFetcher | null = null;

export async function validateGml(xml: string, version: string): Promise<boolean> {
    const xsdUrl = GML_XSD_URLS[version];
    if (!xsdUrl) throw new Error(`Unsupported GML version for validation: ${version}`);

    const xsdSource = await loadXsd(xsdUrl);
    const schemaFileName = sanitizeFileName(xsdUrl);

    let result;
    try {
        result = await validateXML({
            xml,
            schema: [{ fileName: schemaFileName, contents: xsdSource }],
        });
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);

        // Check if it's a schema loading issue
        if (detail.includes('failed to load external entity') ||
            detail.includes('Failed to load the document')) {
            throw new Error(
                `XSD validation failed: Cannot resolve schema references.\n` +
                `This often happens with WFS responses that contain relative schema imports.\n` +
                `Tip: Parse the GML instead of validating, or download and validate locally.`
            );
        }

        throw new Error(`XSD validation failed: ${detail}`);
    }

    return result.valid;
}

export function __setXsdFetcher(fetcher: XsdFetcher | null): void {
    customFetcher = fetcher;
    xsdCache.clear();
}

export function __clearXsdCache(): void {
    xsdCache.clear();
}

async function loadXsd(url: string): Promise<string> {
    const cached = xsdCache.get(url);
    if (cached) return cached;

    const source = await (customFetcher ? customFetcher(url) : fetchXsd(url));
    xsdCache.set(url, source);
    return source;
}

async function fetchXsd(url: string): Promise<string> {
    const parsed = new URL(url);
    const request = parsed.protocol === 'https:' ? httpsRequest : httpRequest;

    return new Promise<string>((resolve, reject) => {
        const req = request(parsed, res => {
            const status = res.statusCode ?? 0;
            if (status >= 300 && status < 400 && res.headers.location) {
                const nextUrl = new URL(res.headers.location, parsed);
                res.resume();
                resolve(fetchXsd(nextUrl.toString()));
                return;
            }
            if (status >= 400) {
                reject(new Error(`Failed to fetch XSD (${status})`));
                return;
            }

            const chunks: Buffer[] = [];
            res.on('data', chunk => chunks.push(Buffer.from(chunk)));
            res.on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf-8'));
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Exported for testing
export const __internal = {
    loadXsd,
};

function sanitizeFileName(value: string): string {
    const fallback = 'schema.xsd';
    const stripped = value.split('/').pop() ?? fallback;
    const normalized = stripped.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+/, '');
    return normalized || fallback;
}
