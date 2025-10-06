import { validateXML } from 'xmllint-wasm';

const GML_XSD_URLS: Record<string, string> = {
    '2.1.2': 'http://schemas.opengis.net/gml/2.1.2/feature.xsd',
    '3.2': 'http://schemas.opengis.net/gml/3.2.1/gml.xsd',
};

type XsdFetcher = (url: string) => Promise<string>;

const xsdCache = new Map<string, string>();
let customFetcher: XsdFetcher | null = null;

/**
 * Validates GML XML against XSD schema using xmllint-wasm
 * Browser-compatible version (no native xmllint support)
 * @param xml - GML XML string to validate
 * @param version - GML version ('2.1.2' or '3.2')
 * @returns Promise<boolean> - true if valid, false otherwise
 */
export async function validateGml(xml: string, version: string): Promise<boolean> {
    const xsdUrl = GML_XSD_URLS[version];
    if (!xsdUrl) throw new Error(`Unsupported GML version for validation: ${version}`);

    // Use xmllint-wasm for validation
    const xsdSource = await loadXsd(xsdUrl);
    const schemaFileName = sanitizeFileName(xsdUrl);

    let result;
    try {
        // Validate with main schema only
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

/**
 * Set a custom XSD fetcher for testing
 * @param fetcher - Custom fetcher function or null to reset
 */
export function __setXsdFetcher(fetcher: XsdFetcher | null): void {
    customFetcher = fetcher;
    xsdCache.clear();
}

/**
 * Clear the XSD cache
 */
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

/**
 * Fetch XSD schema from URL using browser Fetch API
 * @param url - XSD schema URL
 * @returns Promise<string> - XSD schema content
 */
async function fetchXsd(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch XSD (${response.status})`);
    }

    return await response.text();
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
