import { validateXML } from 'xmllint-wasm';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execAsync = promisify(exec);

const GML_XSD_URLS: Record<string, string> = {
    '2.1.2': 'http://schemas.opengis.net/gml/2.1.2/feature.xsd',
    '3.2': 'http://schemas.opengis.net/gml/3.2.1/gml.xsd',
};

// WFS XSD URLs - currently unused as WFS responses with custom features
// cannot be validated without application schemas
// const WFS_XSD_URLS: Record<string, string> = {
//     '1.0.0': 'http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd',
//     '1.1.0': 'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd',
//     '2.0.0': 'http://schemas.opengis.net/wfs/2.0/wfs.xsd',
// };

/**
 * Schema catalog - maps relative schema references to absolute URLs
 * These are currently unused due to xmllint-wasm limitations with multiple schemas
 * but kept for future improvements
 */
// const SCHEMA_CATALOG_2_1_2: Record<string, string> = {
//     // GML 2.1.2 schemas
//     'gml.xsd': 'https://schemas.opengis.net/gml/2.1.2/gml.xsd',
//     'feature.xsd': 'https://schemas.opengis.net/gml/2.1.2/feature.xsd',
//     'geometry.xsd': 'https://schemas.opengis.net/gml/2.1.2/geometry.xsd',

//     'gml/2.1.2/feature.xsd': 'https://schemas.opengis.net/gml/2.1.2/feature.xsd',

//     // W3C schemas
//     'xml.xsd': 'https://www.w3.org/2001/xml.xsd',
//     'xlink.xsd': 'https://www.w3.org/1999/xlink.xsd',
// };

// const SCHEMA_CATALOG_3_1_1: Record<string, string> = {
//     // GML 3.1.1 schemas
//     'gml.xsd': 'https://schemas.opengis.net/gml/3.1.1/base/gml.xsd',
//     'feature.xsd': 'https://schemas.opengis.net/gml/3.1.1/base/feature.xsd',
//     'geometryBasic0d1d.xsd': 'https://schemas.opengis.net/gml/3.1.1/base/geometryBasic0d1d.xsd',
//     'geometryBasic2d.xsd': 'https://schemas.opengis.net/gml/3.1.1/base/geometryBasic2d.xsd',

//     // GML 3.2.1 schemas
//     'gml/3.2.1/gml.xsd': 'https://schemas.opengis.net/gml/3.2.1/gml.xsd',

//     // GML 2.1.2 schemas
//     'gml/2.1.2/feature.xsd': 'https://schemas.opengis.net/gml/2.1.2/feature.xsd',

//     // W3C schemas
//     'xml.xsd': 'https://www.w3.org/2001/xml.xsd',
//     'xlink.xsd': 'https://www.w3.org/1999/xlink.xsd',
// };

// Schema catalogs for future use when xmllint-wasm supports multiple schemas better
// const SCHEMA_CATALOGS: Record<string, Record<string, string>> = {
//     '2.1.2': SCHEMA_CATALOG_2_1_2,
//     '3.1.1': SCHEMA_CATALOG_3_1_1,
//     // '3.2.1': SCHEMA_CATALOG_3_2_1
// };

type XsdFetcher = (url: string) => Promise<string>;

const xsdCache = new Map<string, string>();
let customFetcher: XsdFetcher | null = null;

export async function validateGml(xml: string, version: string): Promise<boolean> {
    const xsdUrl = GML_XSD_URLS[version];
    if (!xsdUrl) throw new Error(`Unsupported GML version for validation: ${version}`);

    // Try native xmllint first (if available and not in test mode)
    if (!customFetcher) {
        try {
            return await validateWithNativeXmllint(xml, xsdUrl);
        } catch (nativeError) {
            // If xmllint is not available, fall back to xmllint-wasm
            if (nativeError instanceof Error && nativeError.message.includes('xmllint not found')) {
                // Continue to WASM fallback
            } else {
                throw nativeError;
            }
        }
    }

    // Fallback: Try xmllint-wasm
    const xsdSource = await loadXsd(xsdUrl);
    const schemaFileName = sanitizeFileName(xsdUrl);

    let result;
    try {
        // First attempt: validate with main schema only
        result = await validateXML({
            xml,
            schema: [{ fileName: schemaFileName, contents: xsdSource }],
        });
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);

        // Check if it's a schema loading issue
        if (detail.includes('failed to load external entity') ||
            detail.includes('Failed to load the document')) {

            // Extract missing schema reference from error message
            const entityMatch = detail.match(/failed to load external entity ["']([^"']+)["']/);
            const docMatch = detail.match(/Failed to load the document ['"]([^'"]+)['"]/);
            const missingSchema = entityMatch?.[1] || docMatch?.[1];

            const schemaInfo = missingSchema
                ? `\nMissing schema reference: ${missingSchema}`
                : '';

            throw new Error(
                `XSD validation failed: Cannot resolve schema references.${schemaInfo}\n` +
                `This often happens with WFS responses that contain relative schema imports.\n` +
                `Tip: Parse the GML instead of validating, or download and validate locally.`
            );
        } else {
            throw new Error(`XSD validation failed: ${detail}`);
        }
    }

    return result.valid;
}

async function validateWithNativeXmllint(xml: string, xsdUrl: string): Promise<boolean> {
    // Check if xmllint is available
    try {
        await execAsync('which xmllint');
    } catch {
        throw new Error('xmllint not found');
    }

    // Detect if this is a WFS response with application-specific features
    // WFS responses with custom feature types cannot be fully validated without
    // the application schema, so we only check well-formedness
    const isWfsResponse = xml.includes('wfs:FeatureCollection') || xml.includes('<FeatureCollection');

    // Create temp directory for this validation
    const tempDir = join(tmpdir(), `gml-validate-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tempDir, { recursive: true });

    const xmlFile = join(tempDir, 'input.xml');

    try {
        // Write XML to temp file
        await writeFile(xmlFile, xml, 'utf-8');

        let command: string;
        if (isWfsResponse) {
            // For WFS responses: only check well-formedness
            // Full schema validation would require the application schema
            command = `xmllint --noout "${xmlFile}"`;
        } else {
            // For plain GML: validate against schema
            command = `xmllint --noout --schema "${xsdUrl}" "${xmlFile}"`;
        }

        const { stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });

        // xmllint outputs validation messages to stderr even on success
        // Check if there are actual errors
        if (stderr && (stderr.includes('fails to validate') || stderr.includes('parser error'))) {
            throw new Error(`XML validation failed:\n${stderr}`);
        }

        return true;
    } finally {
        // Cleanup temp files
        try {
            await unlink(xmlFile);
            // Try to remove the directory (will only work if empty)
            await execAsync(`rmdir "${tempDir}"`).catch(() => { /* ignore errors */ });
        } catch {
            // Ignore cleanup errors
        }
    }
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
