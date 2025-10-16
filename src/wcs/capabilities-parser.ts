/**
 * WCS Capabilities Parser
 *
 * Parses WCS GetCapabilities responses (WCS 1.0, 1.1, 2.0)
 * following OGC WCS specifications
 *
 * Reference: OGC WCS 2.0 Interface Standard - Core (09-110r4)
 */

import { XMLParser } from 'fast-xml-parser';

export type WcsVersion = '2.0.1' | '2.0.0' | '1.1.2' | '1.1.1' | '1.1.0' | '1.0.0';

export interface WcsServiceIdentification {
    title?: string;
    abstract?: string;
    keywords?: string[];
    serviceType?: string;
    serviceTypeVersion?: string[];
    fees?: string;
    accessConstraints?: string[];
}

export interface WcsServiceProvider {
    providerName?: string;
    providerSite?: string;
    serviceContact?: {
        individualName?: string;
        positionName?: string;
        contactInfo?: {
            phone?: string;
            address?: {
                deliveryPoint?: string;
                city?: string;
                postalCode?: string;
                country?: string;
                email?: string;
            };
        };
    };
}

export interface WcsOperationMetadata {
    name: string;
    getUrl?: string;
    postUrl?: string;
}

export interface WcsCoverageSummary {
    coverageId: string;
    coverageSubtype?: string;
    title?: string;
    abstract?: string;
    keywords?: string[];
    boundingBox?: {
        crs?: string;
        lowerCorner: number[];
        upperCorner: number[];
    };
    wgs84BoundingBox?: {
        lowerCorner: number[];
        upperCorner: number[];
    };
}

export interface WcsCapabilities {
    version: WcsVersion;
    updateSequence?: string;
    serviceIdentification?: WcsServiceIdentification;
    serviceProvider?: WcsServiceProvider;
    operations?: WcsOperationMetadata[];
    coverages: WcsCoverageSummary[];
    formats?: string[];
    crs?: string[];
}

export class WcsCapabilitiesParser {
    private xmlParser: XMLParser;

    constructor() {
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            removeNSPrefix: true, // Remove namespace prefixes for easier access
        });
    }

    /**
     * Parse WCS GetCapabilities XML response
     */
    parse(xml: string): WcsCapabilities {
        const parsed = this.xmlParser.parse(xml);

        // Find root Capabilities element
        const root = parsed.Capabilities || parsed.WCS_Capabilities;
        if (!root) {
            throw new Error('Invalid WCS Capabilities document: No Capabilities root element found');
        }

        const version = this.detectVersion(root);

        if (version.startsWith('2.0')) {
            return this.parseWcs20(root, version as WcsVersion);
        } else if (version.startsWith('1.1')) {
            return this.parseWcs11(root, version as WcsVersion);
        } else if (version === '1.0.0') {
            return this.parseWcs10(root);
        }

        throw new Error(`Unsupported WCS version: ${version}`);
    }

    private detectVersion(root: any): string {
        const version = root['@_version'];
        if (version) {
            return version;
        }
        // Default to 2.0.1
        return '2.0.1';
    }

    /**
     * Parse WCS 2.0 Capabilities
     */
    private parseWcs20(root: any, version: WcsVersion): WcsCapabilities {
        const capabilities: WcsCapabilities = {
            version,
            updateSequence: root['@_updateSequence'],
            coverages: [],
        };

        // ServiceIdentification
        if (root.ServiceIdentification) {
            capabilities.serviceIdentification = this.parseServiceIdentification(root.ServiceIdentification);
        }

        // ServiceProvider
        if (root.ServiceProvider) {
            capabilities.serviceProvider = this.parseServiceProvider(root.ServiceProvider);
        }

        // OperationsMetadata
        if (root.OperationsMetadata) {
            capabilities.operations = this.parseOperationsMetadata(root.OperationsMetadata);
        }

        // Contents
        if (root.Contents) {
            const summaries = this.ensureArray(root.Contents.CoverageSummary);
            summaries.forEach((summary: any) => {
                const coverage = this.parseCoverageSummary20(summary);
                if (coverage) {
                    capabilities.coverages.push(coverage);
                }
            });
        }

        // ServiceMetadata
        if (root.ServiceMetadata) {
            capabilities.formats = this.getTextArray(root.ServiceMetadata.formatSupported);
            capabilities.crs = this.getTextArray(root.ServiceMetadata.crsSupported);
        }

        return capabilities;
    }

    /**
     * Parse WCS 1.1 Capabilities
     */
    private parseWcs11(root: any, version: WcsVersion): WcsCapabilities {
        const capabilities: WcsCapabilities = {
            version,
            updateSequence: root['@_updateSequence'],
            coverages: [],
        };

        // ServiceIdentification
        if (root.ServiceIdentification) {
            capabilities.serviceIdentification = this.parseServiceIdentification(root.ServiceIdentification);
        }

        // ServiceProvider
        if (root.ServiceProvider) {
            capabilities.serviceProvider = this.parseServiceProvider(root.ServiceProvider);
        }

        // OperationsMetadata
        if (root.OperationsMetadata) {
            capabilities.operations = this.parseOperationsMetadata(root.OperationsMetadata);
        }

        // Contents
        if (root.Contents) {
            const summaries = this.ensureArray(root.Contents.CoverageSummary);
            summaries.forEach((summary: any) => {
                const coverage = this.parseCoverageSummary11(summary);
                if (coverage) {
                    capabilities.coverages.push(coverage);
                }
            });
        }

        return capabilities;
    }

    /**
     * Parse WCS 1.0 Capabilities
     */
    private parseWcs10(root: any): WcsCapabilities {
        const capabilities: WcsCapabilities = {
            version: '1.0.0',
            updateSequence: root['@_updateSequence'],
            coverages: [],
        };

        // Service
        if (root.Service) {
            capabilities.serviceIdentification = {
                title: this.getText(root.Service.label) || this.getText(root.Service.name),
                abstract: this.getText(root.Service.description),
                keywords: this.getTextArray(root.Service.keywords?.keyword),
            };

            if (root.Service.responsibleParty) {
                capabilities.serviceProvider = {
                    providerName: this.getText(root.Service.responsibleParty.organisationName) ||
                                  this.getText(root.Service.responsibleParty.individualName),
                };
            }
        }

        // Capability
        if (root.Capability?.Request) {
            capabilities.operations = this.parseWcs10Operations(root.Capability.Request);
        }

        // ContentMetadata
        if (root.ContentMetadata) {
            const offerings = this.ensureArray(root.ContentMetadata.CoverageOfferingBrief);
            offerings.forEach((offering: any) => {
                const coverage = this.parseCoverageOffering10(offering);
                if (coverage) {
                    capabilities.coverages.push(coverage);
                }
            });
        }

        return capabilities;
    }

    // Helper parsing methods

    private parseServiceIdentification(elem: any): WcsServiceIdentification {
        return {
            title: this.getText(elem.Title),
            abstract: this.getText(elem.Abstract),
            keywords: this.getTextArray(elem.Keywords?.Keyword),
            serviceType: this.getText(elem.ServiceType),
            serviceTypeVersion: this.getTextArray(elem.ServiceTypeVersion),
            fees: this.getText(elem.Fees),
            accessConstraints: this.getTextArray(elem.AccessConstraints),
        };
    }

    private parseServiceProvider(elem: any): WcsServiceProvider {
        const provider: WcsServiceProvider = {
            providerName: this.getText(elem.ProviderName),
            providerSite: elem.ProviderSite?.['@_href'] || elem.ProviderSite?.['@_xlink:href'],
        };

        if (elem.ServiceContact) {
            provider.serviceContact = {
                individualName: this.getText(elem.ServiceContact.IndividualName),
                positionName: this.getText(elem.ServiceContact.PositionName),
            };

            if (elem.ServiceContact.ContactInfo) {
                const contact = elem.ServiceContact.ContactInfo;
                provider.serviceContact.contactInfo = {
                    phone: this.getText(contact.Phone?.Voice),
                    address: contact.Address ? {
                        deliveryPoint: this.getText(contact.Address.DeliveryPoint),
                        city: this.getText(contact.Address.City),
                        postalCode: this.getText(contact.Address.PostalCode),
                        country: this.getText(contact.Address.Country),
                        email: this.getText(contact.Address.ElectronicMailAddress),
                    } : undefined,
                };
            }
        }

        return provider;
    }

    private parseOperationsMetadata(elem: any): WcsOperationMetadata[] {
        const operations: WcsOperationMetadata[] = [];
        const ops = this.ensureArray(elem.Operation);

        ops.forEach((op: any) => {
            const name = op['@_name'];
            if (!name) return;

            const operation: WcsOperationMetadata = { name };

            if (op.DCP?.HTTP) {
                const http = op.DCP.HTTP;
                if (http.Get) {
                    operation.getUrl = http.Get['@_href'] || http.Get['@_xlink:href'];
                }
                if (http.Post) {
                    operation.postUrl = http.Post['@_href'] || http.Post['@_xlink:href'];
                }
            }

            operations.push(operation);
        });

        return operations;
    }

    private parseCoverageSummary20(elem: any): WcsCoverageSummary | null {
        const coverageId = this.getText(elem.CoverageId);
        if (!coverageId) return null;

        const summary: WcsCoverageSummary = {
            coverageId,
            coverageSubtype: this.getText(elem.CoverageSubtype),
            title: this.getText(elem.Title),
            abstract: this.getText(elem.Abstract),
            keywords: this.getTextArray(elem.Keywords?.Keyword),
        };

        // BoundingBox
        if (elem.BoundingBox) {
            const lower = this.getText(elem.BoundingBox.LowerCorner);
            const upper = this.getText(elem.BoundingBox.UpperCorner);
            if (lower && upper) {
                summary.boundingBox = {
                    crs: elem.BoundingBox['@_crs'],
                    lowerCorner: lower.split(/\s+/).map(Number),
                    upperCorner: upper.split(/\s+/).map(Number),
                };
            }
        }

        // WGS84BoundingBox
        if (elem.WGS84BoundingBox) {
            const lower = this.getText(elem.WGS84BoundingBox.LowerCorner);
            const upper = this.getText(elem.WGS84BoundingBox.UpperCorner);
            if (lower && upper) {
                summary.wgs84BoundingBox = {
                    lowerCorner: lower.split(/\s+/).map(Number),
                    upperCorner: upper.split(/\s+/).map(Number),
                };
            }
        }

        return summary;
    }

    private parseCoverageSummary11(elem: any): WcsCoverageSummary | null {
        const identifier = this.getText(elem.Identifier);
        if (!identifier) return null;

        const summary: WcsCoverageSummary = {
            coverageId: identifier,
            title: this.getText(elem.Title),
            abstract: this.getText(elem.Abstract),
            keywords: this.getTextArray(elem.Keywords?.Keyword),
        };

        // WGS84BoundingBox
        if (elem.WGS84BoundingBox) {
            const lower = this.getText(elem.WGS84BoundingBox.LowerCorner);
            const upper = this.getText(elem.WGS84BoundingBox.UpperCorner);
            if (lower && upper) {
                summary.wgs84BoundingBox = {
                    lowerCorner: lower.split(/\s+/).map(Number),
                    upperCorner: upper.split(/\s+/).map(Number),
                };
            }
        }

        return summary;
    }

    private parseCoverageOffering10(elem: any): WcsCoverageSummary | null {
        const name = this.getText(elem.name);
        if (!name) return null;

        const summary: WcsCoverageSummary = {
            coverageId: name,
            title: this.getText(elem.label),
            abstract: this.getText(elem.description),
            keywords: this.getTextArray(elem.keywords?.keyword),
        };

        // lonLatEnvelope
        if (elem.lonLatEnvelope) {
            const positions = this.ensureArray(elem.lonLatEnvelope.pos);
            if (positions.length >= 2) {
                const lower = this.getText(positions[0]);
                const upper = this.getText(positions[1]);
                if (lower && upper) {
                    summary.wgs84BoundingBox = {
                        lowerCorner: lower.split(/\s+/).map(Number),
                        upperCorner: upper.split(/\s+/).map(Number),
                    };
                }
            }
        }

        return summary;
    }

    private parseWcs10Operations(request: any): WcsOperationMetadata[] {
        const operations: WcsOperationMetadata[] = [];

        ['GetCapabilities', 'DescribeCoverage', 'GetCoverage'].forEach(opName => {
            const op = request[opName];
            if (!op) return;

            const operation: WcsOperationMetadata = { name: opName };

            if (op.DCPType?.HTTP) {
                const http = op.DCPType.HTTP;
                if (http.Get?.OnlineResource) {
                    operation.getUrl = http.Get.OnlineResource['@_href'] || http.Get.OnlineResource['@_xlink:href'];
                }
                if (http.Post?.OnlineResource) {
                    operation.postUrl = http.Post.OnlineResource['@_href'] || http.Post.OnlineResource['@_xlink:href'];
                }
            }

            operations.push(operation);
        });

        return operations;
    }

    // Utility methods

    private getText(value: any): string | undefined {
        if (!value) return undefined;
        if (typeof value === 'string') return value.trim() || undefined;
        if (typeof value === 'object' && '#text' in value) {
            const text = value['#text'];
            return typeof text === 'string' ? text.trim() || undefined : undefined;
        }
        return undefined;
    }

    private getTextArray(value: any): string[] {
        if (!value) return [];
        const arr = this.ensureArray(value);
        return arr.map(v => this.getText(v)).filter((t): t is string => t !== undefined);
    }

    private ensureArray(value: any): any[] {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }
}

/**
 * Helper function to parse WCS Capabilities XML
 */
export function parseWcsCapabilities(xml: string): WcsCapabilities {
    const parser = new WcsCapabilitiesParser();
    return parser.parse(xml);
}
