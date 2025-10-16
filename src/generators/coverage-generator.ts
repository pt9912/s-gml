import type {
    GmlRectifiedGridCoverage,
    GmlGridCoverage,
    GmlReferenceableGridCoverage,
    GmlMultiPointCoverage,
    GmlCoverage,
    GmlRangeType,
    GmlRangeSet,
    GmlEnvelope,
    GmlRectifiedGrid,
    GmlGrid,
    GmlMultiPoint,
    GmlTemporalAxis,
} from '../types.js';

/**
 * Coverage Generator - Generates WCS 2.0 XML from Coverage objects
 *
 * This generator creates GML 3.2 Coverage XML following WCS 2.0 specification,
 * enabling round-trip conversion: GML → Object → GML
 *
 * Reference: OGC WCS 2.0 Interface Standard - Core (09-110r4)
 */
export class CoverageGenerator {
    /**
     * Generate GML XML from any Coverage type
     */
    generate(coverage: GmlCoverage, prettyPrint = false): string {
        let xml: string;

        switch (coverage.type) {
            case 'RectifiedGridCoverage':
                xml = this.generateRectifiedGridCoverage(coverage);
                break;
            case 'GridCoverage':
                xml = this.generateGridCoverage(coverage);
                break;
            case 'ReferenceableGridCoverage':
                xml = this.generateReferenceableGridCoverage(coverage);
                break;
            case 'MultiPointCoverage':
                xml = this.generateMultiPointCoverage(coverage);
                break;
            default:
                throw new Error(`Unsupported coverage type: ${(coverage as any).type}`);
        }

        if (prettyPrint) {
            return this.formatXml(xml);
        }

        return xml;
    }

    /**
     * Generate RectifiedGridCoverage XML
     */
    generateRectifiedGridCoverage(coverage: GmlRectifiedGridCoverage): string {
        const idAttr = coverage.id ? ` gml:id="${this.escapeXml(coverage.id)}"` : '';

        const parts = [
            `<gml:RectifiedGridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:swe="http://www.opengis.net/swe/2.0"${idAttr}>`,
        ];

        // boundedBy
        if (coverage.boundedBy) {
            parts.push(this.generateBoundedBy(coverage.boundedBy));
        }

        // domainSet
        parts.push('<gml:domainSet>');
        parts.push(this.generateRectifiedGrid(coverage.domainSet));
        parts.push('</gml:domainSet>');

        // rangeSet
        parts.push(this.generateRangeSet(coverage.rangeSet));

        // rangeType
        if (coverage.rangeType) {
            parts.push(this.generateRangeType(coverage.rangeType));
        }

        // temporal axis
        if (coverage.temporal) {
            parts.push(this.generateTemporalAxis(coverage.temporal));
        }

        parts.push('</gml:RectifiedGridCoverage>');

        return parts.join('');
    }

    /**
     * Generate GridCoverage XML
     */
    generateGridCoverage(coverage: GmlGridCoverage): string {
        const idAttr = coverage.id ? ` gml:id="${this.escapeXml(coverage.id)}"` : '';

        const parts = [
            `<gml:GridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:swe="http://www.opengis.net/swe/2.0"${idAttr}>`,
        ];

        // boundedBy
        if (coverage.boundedBy) {
            parts.push(this.generateBoundedBy(coverage.boundedBy));
        }

        // domainSet
        parts.push('<gml:domainSet>');
        parts.push(this.generateGrid(coverage.domainSet));
        parts.push('</gml:domainSet>');

        // rangeSet
        parts.push(this.generateRangeSet(coverage.rangeSet));

        // rangeType
        if (coverage.rangeType) {
            parts.push(this.generateRangeType(coverage.rangeType));
        }

        // temporal axis
        if (coverage.temporal) {
            parts.push(this.generateTemporalAxis(coverage.temporal));
        }

        parts.push('</gml:GridCoverage>');

        return parts.join('');
    }

    /**
     * Generate ReferenceableGridCoverage XML
     */
    generateReferenceableGridCoverage(coverage: GmlReferenceableGridCoverage): string {
        const idAttr = coverage.id ? ` gml:id="${this.escapeXml(coverage.id)}"` : '';

        const parts = [
            `<gml:ReferenceableGridCoverage xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:swe="http://www.opengis.net/swe/2.0"${idAttr}>`,
        ];

        // boundedBy
        if (coverage.boundedBy) {
            parts.push(this.generateBoundedBy(coverage.boundedBy));
        }

        // domainSet
        parts.push('<gml:domainSet>');
        parts.push(this.generateGrid(coverage.domainSet));
        parts.push('</gml:domainSet>');

        // rangeSet
        parts.push(this.generateRangeSet(coverage.rangeSet));

        // rangeType
        if (coverage.rangeType) {
            parts.push(this.generateRangeType(coverage.rangeType));
        }

        // temporal axis
        if (coverage.temporal) {
            parts.push(this.generateTemporalAxis(coverage.temporal));
        }

        parts.push('</gml:ReferenceableGridCoverage>');

        return parts.join('');
    }

    /**
     * Generate MultiPointCoverage XML
     */
    generateMultiPointCoverage(coverage: GmlMultiPointCoverage): string {
        const idAttr = coverage.id ? ` gml:id="${this.escapeXml(coverage.id)}"` : '';

        const parts = [
            `<gml:MultiPointCoverage xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:swe="http://www.opengis.net/swe/2.0"${idAttr}>`,
        ];

        // boundedBy
        if (coverage.boundedBy) {
            parts.push(this.generateBoundedBy(coverage.boundedBy));
        }

        // domainSet
        parts.push('<gml:domainSet>');
        parts.push(this.generateMultiPoint(coverage.domainSet));
        parts.push('</gml:domainSet>');

        // rangeSet
        parts.push(this.generateRangeSet(coverage.rangeSet));

        // rangeType
        if (coverage.rangeType) {
            parts.push(this.generateRangeType(coverage.rangeType));
        }

        parts.push('</gml:MultiPointCoverage>');

        return parts.join('');
    }

    // ============ Helper Methods ============

    private generateBoundedBy(envelope: GmlEnvelope): string {
        const srsAttr = envelope.srsName ? ` srsName="${this.escapeXml(envelope.srsName)}"` : '';
        return [
            '<gml:boundedBy>',
            `<gml:Envelope${srsAttr}>`,
            `<gml:lowerCorner>${envelope.bbox[0]} ${envelope.bbox[1]}</gml:lowerCorner>`,
            `<gml:upperCorner>${envelope.bbox[2]} ${envelope.bbox[3]}</gml:upperCorner>`,
            '</gml:Envelope>',
            '</gml:boundedBy>',
        ].join('');
    }

    private generateRectifiedGrid(grid: GmlRectifiedGrid): string {
        const idAttr = grid.id ? ` gml:id="${this.escapeXml(grid.id)}"` : '';
        const srsAttr = grid.srsName ? ` srsName="${this.escapeXml(grid.srsName)}"` : '';

        const parts = [
            `<gml:RectifiedGrid${idAttr} dimension="${grid.dimension}"${srsAttr}>`,
            '<gml:limits>',
            '<gml:GridEnvelope>',
            `<gml:low>${grid.limits.low.join(' ')}</gml:low>`,
            `<gml:high>${grid.limits.high.join(' ')}</gml:high>`,
            '</gml:GridEnvelope>',
            '</gml:limits>',
        ];

        // axisLabels
        if (grid.axisLabels && grid.axisLabels.length > 0) {
            parts.push(`<gml:axisLabels>${grid.axisLabels.join(' ')}</gml:axisLabels>`);
        }

        // origin
        parts.push('<gml:origin>');
        parts.push(`<gml:Point gml:id="P1"><gml:pos>${grid.origin.join(' ')}</gml:pos></gml:Point>`);
        parts.push('</gml:origin>');

        // offsetVectors
        grid.offsetVectors.forEach(vector => {
            parts.push(`<gml:offsetVector>${vector.join(' ')}</gml:offsetVector>`);
        });

        parts.push('</gml:RectifiedGrid>');

        return parts.join('');
    }

    private generateGrid(grid: GmlGrid): string {
        const idAttr = grid.id ? ` gml:id="${this.escapeXml(grid.id)}"` : '';

        const parts = [
            `<gml:Grid${idAttr} dimension="${grid.dimension}">`,
            '<gml:limits>',
            '<gml:GridEnvelope>',
            `<gml:low>${grid.limits.low.join(' ')}</gml:low>`,
            `<gml:high>${grid.limits.high.join(' ')}</gml:high>`,
            '</gml:GridEnvelope>',
            '</gml:limits>',
        ];

        // axisLabels
        if (grid.axisLabels && grid.axisLabels.length > 0) {
            parts.push(`<gml:axisLabels>${grid.axisLabels.join(' ')}</gml:axisLabels>`);
        }

        parts.push('</gml:Grid>');

        return parts.join('');
    }

    private generateMultiPoint(multiPoint: GmlMultiPoint): string {
        const srsAttr = multiPoint.srsName ? ` srsName="${this.escapeXml(multiPoint.srsName)}"` : '';

        const parts = [
            `<gml:MultiPoint gml:id="MP1"${srsAttr}>`,
        ];

        // pointMembers
        multiPoint.coordinates.forEach((coord, index) => {
            parts.push('<gml:pointMember>');
            parts.push(`<gml:Point gml:id="P${index + 1}"><gml:pos>${coord.join(' ')}</gml:pos></gml:Point>`);
            parts.push('</gml:pointMember>');
        });

        parts.push('</gml:MultiPoint>');

        return parts.join('');
    }

    private generateRangeSet(rangeSet: GmlRangeSet): string {
        const parts = ['<gml:rangeSet>'];

        if (rangeSet.file) {
            parts.push('<gml:File>');
            parts.push('<gml:rangeParameters/>');
            parts.push(`<gml:fileName>${this.escapeXml(rangeSet.file.fileName)}</gml:fileName>`);
            if (rangeSet.file.fileStructure) {
                parts.push(`<gml:fileStructure>${this.escapeXml(rangeSet.file.fileStructure)}</gml:fileStructure>`);
            }
            parts.push('</gml:File>');
        } else {
            // Empty rangeSet (data would be inline or in DataBlock)
            parts.push('<gml:DataBlock/>');
        }

        parts.push('</gml:rangeSet>');

        return parts.join('');
    }

    private generateRangeType(rangeType: GmlRangeType): string {
        if (!rangeType.field || rangeType.field.length === 0) {
            return '<gmlcov:rangeType/>';
        }

        const parts = [
            '<gmlcov:rangeType>',
            '<swe:DataRecord>',
        ];

        rangeType.field.forEach(field => {
            const nameAttr = ` name="${this.escapeXml(field.name)}"`;
            parts.push(`<swe:field${nameAttr}>`);

            const uomAttr = field.uom ? ` uom="${this.escapeXml(field.uom)}"` : '';
            parts.push(`<swe:Quantity${uomAttr}>`);

            if (field.description) {
                parts.push(`<swe:description>${this.escapeXml(field.description)}</swe:description>`);
            }

            if (field.dataType) {
                parts.push(`<swe:dataType>${this.escapeXml(field.dataType)}</swe:dataType>`);
            }

            parts.push('</swe:Quantity>');
            parts.push('</swe:field>');
        });

        parts.push('</swe:DataRecord>');
        parts.push('</gmlcov:rangeType>');

        return parts.join('');
    }

    private generateTemporalAxis(temporal: GmlTemporalAxis): string {
        const parts = [
            '<gmlcov:metadata>',
            '<gmlcov:Extension>',
            `<gml:timePosition>${this.escapeXml(temporal.startTime)}</gml:timePosition>`,
            `<gml:timePosition>${this.escapeXml(temporal.endTime)}</gml:timePosition>`,
        ];

        if (temporal.resolution) {
            parts.push(`<gml:timeResolution>${this.escapeXml(temporal.resolution)}</gml:timeResolution>`);
        }

        if (temporal.uom) {
            parts.push(`<gml:uom>${this.escapeXml(temporal.uom)}</gml:uom>`);
        }

        parts.push('</gmlcov:Extension>');
        parts.push('</gmlcov:metadata>');

        return parts.join('');
    }

    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    private formatXml(xml: string): string {
        let formatted = '';
        let indent = 0;
        const tab = '    ';

        xml.split(/(<[^>]+>)/g).forEach(node => {
            if (!node.trim()) return;

            if (node.startsWith('</')) {
                indent--;
                formatted += tab.repeat(indent) + node + '\n';
            } else if (node.startsWith('<') && !node.endsWith('/>') && !node.includes('</')) {
                formatted += tab.repeat(indent) + node + '\n';
                if (!node.match(/<\w+[^>]*>[^<]+<\/\w+>/)) {
                    indent++;
                }
            } else {
                formatted += tab.repeat(indent) + node + '\n';
            }
        });

        return formatted.trim();
    }
}

/**
 * Helper function to generate Coverage XML
 */
export function generateCoverageXml(coverage: GmlCoverage, prettyPrint = false): string {
    const generator = new CoverageGenerator();
    return generator.generate(coverage, prettyPrint);
}
