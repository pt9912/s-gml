/**
 * OWS Exception Report handling
 * Parses and handles OGC Web Services Exception Reports
 * @see https://schemas.opengis.net/ows/1.1.0/owsExceptionReport.xsd
 */

import { XMLParser } from 'fast-xml-parser';

/**
 * Represents a single exception from an OWS Exception Report
 */
export interface OwsException {
    exceptionCode: string;
    locator?: string;
    exceptionText: string[];
}

/**
 * Represents an OWS Exception Report
 */
export interface OwsExceptionReport {
    version: string;
    exceptions: OwsException[];
}

/**
 * Custom error class for OWS Exception Reports
 */
export class OwsExceptionError extends Error {
    public readonly report: OwsExceptionReport;

    constructor(report: OwsExceptionReport) {
        const firstException = report.exceptions[0];
        const message = firstException
            ? `OWS Exception [${firstException.exceptionCode}]: ${firstException.exceptionText.join(', ')}`
            : 'OWS Exception Report received';

        super(message);
        this.name = 'OwsExceptionError';
        this.report = report;

        // Maintain proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, OwsExceptionError);
        }
    }

    /**
     * Get all exception messages as a formatted string
     */
    public getAllMessages(): string {
        return this.report.exceptions
            .map((ex) => {
                const locator = ex.locator ? ` [${ex.locator}]` : '';
                return `${ex.exceptionCode}${locator}: ${ex.exceptionText.join(', ')}`;
            })
            .join('\n');
    }
}

/**
 * Checks if the XML string is an OWS Exception Report
 */
export function isOwsExceptionReport(xml: string): boolean {
    return xml.includes('<ows:ExceptionReport') || xml.includes('<ExceptionReport');
}

/**
 * Parses an OWS Exception Report XML string
 */
export function parseOwsExceptionReport(xml: string): OwsExceptionReport {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
    });

    const parsed = parser.parse(xml);

    // Find the ExceptionReport element
    const reportKey = Object.keys(parsed).find(
        (key) => key === 'ows:ExceptionReport' || key === 'ExceptionReport'
    );

    if (!reportKey) {
        throw new Error('Not a valid OWS Exception Report');
    }

    const report = parsed[reportKey];
    const version = report['@_version'] || '1.0.0';

    // Handle exceptions - can be single or array
    const exceptionKey = Object.keys(report).find(
        (key) => key === 'ows:Exception' || key === 'Exception'
    );

    if (!exceptionKey) {
        return { version, exceptions: [] };
    }

    const exceptionData = report[exceptionKey];
    const exceptionArray = Array.isArray(exceptionData) ? exceptionData : [exceptionData];

    const exceptions: OwsException[] = exceptionArray.map((ex) => {
        const exceptionCode = ex['@_exceptionCode'] || 'Unknown';
        const locator = ex['@_locator'];

        // Handle ExceptionText - can be single or array
        const textKey = Object.keys(ex).find(
            (key) => key === 'ows:ExceptionText' || key === 'ExceptionText'
        );

        let exceptionText: string[] = [];
        if (textKey) {
            const textData = ex[textKey];
            if (Array.isArray(textData)) {
                exceptionText = textData.map((t) => (typeof t === 'string' ? t : t['#text'] || ''));
            } else if (typeof textData === 'string') {
                exceptionText = [textData];
            } else if (textData && textData['#text']) {
                exceptionText = [textData['#text']];
            }
        }

        return {
            exceptionCode,
            locator,
            exceptionText,
        };
    });

    return { version, exceptions };
}

/**
 * Parses an OWS Exception Report and throws an OwsExceptionError
 */
export function throwOwsException(xml: string): never {
    const report = parseOwsExceptionReport(xml);
    throw new OwsExceptionError(report);
}
