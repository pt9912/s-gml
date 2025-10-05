import {
    isOwsExceptionReport,
    parseOwsExceptionReport,
    OwsExceptionError,
    throwOwsException,
} from '../src/ows-exception.js';

describe('OWS Exception Report', () => {
    const sampleExceptionReport = `<?xml version="1.0" encoding="UTF-8"?>
<ows:ExceptionReport xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ows="http://www.opengis.net/ows" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/ows https://ahocevar.com/geoserver/schemas/ows/1.0.0/owsExceptionReport.xsd">
  <ows:Exception exceptionCode="InvalidParameterValue" locator="outputFormat">
    <ows:ExceptionText>Failed to find response for output format GML23</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>`;

    const multipleExceptionsReport = `<?xml version="1.0" encoding="UTF-8"?>
<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows" version="2.0.0">
  <ows:Exception exceptionCode="NoApplicableCode">
    <ows:ExceptionText>First error message</ows:ExceptionText>
    <ows:ExceptionText>Second error message</ows:ExceptionText>
  </ows:Exception>
  <ows:Exception exceptionCode="OperationNotSupported" locator="GetFeature">
    <ows:ExceptionText>Operation not supported</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>`;

    const noNamespaceReport = `<?xml version="1.0" encoding="UTF-8"?>
<ExceptionReport version="1.1.0">
  <Exception exceptionCode="MissingParameterValue" locator="request">
    <ExceptionText>Missing required parameter</ExceptionText>
  </Exception>
</ExceptionReport>`;

    describe('isOwsExceptionReport', () => {
        it('detects OWS Exception Report with namespace', () => {
            expect(isOwsExceptionReport(sampleExceptionReport)).toBe(true);
        });

        it('detects OWS Exception Report without namespace prefix', () => {
            expect(isOwsExceptionReport(noNamespaceReport)).toBe(true);
        });

        it('returns false for regular GML', () => {
            const gml = `<gml:Point xmlns:gml="http://www.opengis.net/gml">
                <gml:pos>10 20</gml:pos>
            </gml:Point>`;
            expect(isOwsExceptionReport(gml)).toBe(false);
        });

        it('returns false for empty string', () => {
            expect(isOwsExceptionReport('')).toBe(false);
        });
    });

    describe('parseOwsExceptionReport', () => {
        it('parses single exception with locator', () => {
            const report = parseOwsExceptionReport(sampleExceptionReport);

            expect(report.version).toBe('1.0.0');
            expect(report.exceptions).toHaveLength(1);
            expect(report.exceptions[0]).toEqual({
                exceptionCode: 'InvalidParameterValue',
                locator: 'outputFormat',
                exceptionText: ['Failed to find response for output format GML23'],
            });
        });

        it('parses multiple exceptions', () => {
            const report = parseOwsExceptionReport(multipleExceptionsReport);

            expect(report.version).toBe('2.0.0');
            expect(report.exceptions).toHaveLength(2);

            expect(report.exceptions[0].exceptionCode).toBe('NoApplicableCode');
            expect(report.exceptions[0].exceptionText).toHaveLength(2);
            expect(report.exceptions[0].exceptionText).toEqual([
                'First error message',
                'Second error message',
            ]);

            expect(report.exceptions[1].exceptionCode).toBe('OperationNotSupported');
            expect(report.exceptions[1].locator).toBe('GetFeature');
            expect(report.exceptions[1].exceptionText).toEqual(['Operation not supported']);
        });

        it('parses exception without namespace prefix', () => {
            const report = parseOwsExceptionReport(noNamespaceReport);

            expect(report.version).toBe('1.1.0');
            expect(report.exceptions).toHaveLength(1);
            expect(report.exceptions[0]).toEqual({
                exceptionCode: 'MissingParameterValue',
                locator: 'request',
                exceptionText: ['Missing required parameter'],
            });
        });

        it('handles exception without locator', () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows" version="1.0.0">
  <ows:Exception exceptionCode="NoApplicableCode">
    <ows:ExceptionText>Generic error</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>`;

            const report = parseOwsExceptionReport(xml);

            expect(report.exceptions[0].locator).toBeUndefined();
            expect(report.exceptions[0].exceptionCode).toBe('NoApplicableCode');
        });

        it('handles empty exception report', () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows" version="1.0.0">
</ows:ExceptionReport>`;

            const report = parseOwsExceptionReport(xml);

            expect(report.version).toBe('1.0.0');
            expect(report.exceptions).toHaveLength(0);
        });

        it('throws error for invalid XML', () => {
            const invalidXml = '<invalid>not an exception report</invalid>';

            expect(() => parseOwsExceptionReport(invalidXml)).toThrow(
                'Not a valid OWS Exception Report'
            );
        });

        it('defaults to version 1.0.0 if not specified', () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows">
  <ows:Exception exceptionCode="Test">
    <ows:ExceptionText>Test</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>`;

            const report = parseOwsExceptionReport(xml);
            expect(report.version).toBe('1.0.0');
        });
    });

    describe('OwsExceptionError', () => {
        it('creates error with correct message', () => {
            const report = parseOwsExceptionReport(sampleExceptionReport);
            const error = new OwsExceptionError(report);

            expect(error.name).toBe('OwsExceptionError');
            expect(error.message).toBe(
                'OWS Exception [InvalidParameterValue]: Failed to find response for output format GML23'
            );
            expect(error.report).toEqual(report);
        });

        it('handles multiple exceptions in error message', () => {
            const report = parseOwsExceptionReport(multipleExceptionsReport);
            const error = new OwsExceptionError(report);

            expect(error.message).toContain('NoApplicableCode');
            expect(error.message).toContain('First error message');
        });

        it('getAllMessages returns formatted string', () => {
            const report = parseOwsExceptionReport(multipleExceptionsReport);
            const error = new OwsExceptionError(report);

            const messages = error.getAllMessages();

            expect(messages).toContain('NoApplicableCode: First error message, Second error message');
            expect(messages).toContain('OperationNotSupported [GetFeature]: Operation not supported');
        });

        it('handles empty exception report', () => {
            const report = { version: '1.0.0', exceptions: [] };
            const error = new OwsExceptionError(report);

            expect(error.message).toBe('OWS Exception Report received');
        });
    });

    describe('throwOwsException', () => {
        it('throws OwsExceptionError', () => {
            expect(() => throwOwsException(sampleExceptionReport)).toThrow(OwsExceptionError);
        });

        it('throws with correct exception details', () => {
            try {
                throwOwsException(sampleExceptionReport);
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(OwsExceptionError);
                const owsError = error as OwsExceptionError;
                expect(owsError.report.exceptions[0].exceptionCode).toBe('InvalidParameterValue');
            }
        });
    });

    describe('Integration with GmlParser', () => {
        it('parser throws OwsExceptionError for exception reports', async () => {
            const { GmlParser } = await import('../src/parser.js');
            const parser = new GmlParser();

            await expect(parser.parse(sampleExceptionReport)).rejects.toThrow(OwsExceptionError);
        });

        it('parser convert throws OwsExceptionError for exception reports', async () => {
            const { GmlParser } = await import('../src/parser.js');
            const parser = new GmlParser();

            await expect(
                parser.convert(sampleExceptionReport, { outputVersion: '3.2' })
            ).rejects.toThrow(OwsExceptionError);
        });

        it('thrown error contains exception details', async () => {
            const { GmlParser } = await import('../src/parser.js');
            const parser = new GmlParser();

            try {
                await parser.parse(sampleExceptionReport);
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(OwsExceptionError);
                const owsError = error as OwsExceptionError;
                expect(owsError.message).toContain('InvalidParameterValue');
                expect(owsError.message).toContain('Failed to find response for output format GML23');
            }
        });
    });
});
