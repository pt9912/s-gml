import { validateGml, __setXsdFetcher, __clearXsdCache } from '../src/validator.js';

const SIMPLE_XSD = `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://example.com/schema" elementFormDefault="qualified">
  <xs:element name="Root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="value" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

const VALID_XML = '<Root xmlns="http://example.com/schema"><value>ok</value></Root>';
const INVALID_XML = '<Root xmlns="http://example.com/schema"></Root>';

describe('validateGml', () => {
    beforeEach(() => {
        __setXsdFetcher(async () => SIMPLE_XSD);
    });

    afterEach(() => {
        __setXsdFetcher(null);
        __clearXsdCache();
    });

    it('returns true when XML matches the schema', async () => {
        await expect(validateGml(VALID_XML, '3.2')).resolves.toBe(true);
    });

    it('returns false when XML does not match the schema', async () => {
        await expect(validateGml(INVALID_XML, '3.2')).resolves.toBe(false);
    });

    it('throws for unsupported version', async () => {
        await expect(validateGml('<xml/>', '1.0')).rejects.toThrow('Unsupported GML version');
    });

    it('uses cached XSD on subsequent calls', async () => {
        let fetchCount = 0;
        __setXsdFetcher(async () => {
            fetchCount++;
            return SIMPLE_XSD;
        });

        await validateGml(VALID_XML, '3.2');
        await validateGml(VALID_XML, '3.2');

        expect(fetchCount).toBe(1);
    });

    it('throws error when XSD validation fails with error details', async () => {
        __setXsdFetcher(async () => {
            throw new Error('Network error');
        });

        await expect(validateGml(VALID_XML, '3.2')).rejects.toThrow('Network error');
    });

    it('clears cache when __clearXsdCache is called', async () => {
        let fetchCount = 0;
        __setXsdFetcher(async () => {
            fetchCount++;
            return SIMPLE_XSD;
        });

        await validateGml(VALID_XML, '3.2');
        __clearXsdCache();
        await validateGml(VALID_XML, '3.2');

        expect(fetchCount).toBe(2);
    });

    it('tests internal loadXsd with custom fetcher', async () => {
        const { __internal } = await import('../src/validator.js');
        __setXsdFetcher(async () => SIMPLE_XSD);

        const result = await __internal.loadXsd('http://test.com/schema.xsd');
        expect(result).toBe(SIMPLE_XSD);
    });

    it('tests internal loadXsd with caching', async () => {
        const { __internal } = await import('../src/validator.js');
        let fetchCount = 0;
        __setXsdFetcher(async () => {
            fetchCount++;
            return SIMPLE_XSD;
        });

        await __internal.loadXsd('http://test.com/schema.xsd');
        await __internal.loadXsd('http://test.com/schema.xsd');

        expect(fetchCount).toBe(1);
    });
});
