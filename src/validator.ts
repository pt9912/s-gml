import validate from 'xsd-validator';

const GML_XSD_URLS: Record<string, string> = {
    '2.1.2': 'http://schemas.opengis.net/gml/2.1.2/feature.xsd',
    '3.2': 'http://schemas.opengis.net/gml/3.2.1/gml.xsd',
};

export async function validateGml(xml: string, version: string): Promise<boolean> {
    const xsdUrl = GML_XSD_URLS[version];
    if (!xsdUrl) throw new Error(`Unsupported GML version for validation: ${version}`);
    const result = await validate(xml, xsdUrl);
    return result === true;
}
